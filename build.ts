import { existsSync } from 'fs'
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { glob } from 'glob'
import { dirname, join, resolve } from 'path'
import * as esbuild from 'esbuild'
import JSON5 from 'json5'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

class Builder {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'
  private readonly ESM = '\x1b[32mESM\x1b[0m'
  private readonly TYPES = '\x1b[35mTYPES\x1b[0m'
  
  private readonly assets = ['README.md', 'tsconfig.json', 'package.json']
  private readonly sharedConfig: esbuild.BuildOptions = {
    platform: 'node',
    bundle: true,
    target: 'node20',
    packages: 'external',
    minify: false,
    minifyWhitespace: false,
    minifyIdentifiers: true,
    minifySyntax: true,
    sourcemap: false,
    legalComments: 'inline'
  }

  constructor() {}

  private async cleanPublishDirectory(): Promise<void> {
    console.log(`${this.CLI} Cleaning up old publish directory...`)
    if (existsSync('publish')) await rm('publish', { recursive: true })
    console.log(`${this.CLI} Cleaned publish directory`)
  }

  private async generateTypes(): Promise<void> {
    console.log(`${this.TYPES} Generating TypeScript declarations...`)
    
    try {
      // Limpa a pasta dist antes de gerar as tipagens
      if (existsSync('core/dist')) {
        console.log(`${this.TYPES} Cleaning up old dist directory...`)
        await rm('core/dist', { recursive: true })
        console.log(`${this.TYPES} Cleaned dist directory`)
      }

      // Gera as tipagens usando tsc
      await execAsync('tsc -p core/tsconfig.build.json --noEmit false')
      console.log(`${this.TYPES} TypeScript declarations generated successfully`)
    } catch (error) {
      console.error(`${this.TYPES} Error generating TypeScript declarations:`, error)
      throw error
    }
  }

  private async copyTypesToPublish(): Promise<void> {
    console.log(`${this.TYPES} Copying type definitions to publish directory...`)

    // Copia as tipagens da pasta core
    if (existsSync('core/dist/types/core/src')) {
      await mkdir('publish/core/dist/types', { recursive: true })
      const coreFiles = await glob('core/dist/types/core/src/**/*.ts')
      
      for (const file of coreFiles) {
        const relativePath = file.replace('core/dist/types/core/src/', '')
        const targetPath = join('publish/core/dist/types', relativePath)
        await mkdir(dirname(targetPath), { recursive: true })
        await cp(file, targetPath)
      }
    }

    // Copia as tipagens dos pacotes
    const packages = await glob('core/dist/types/packages/*')
    for (const packagePath of packages) {
      const packageName = packagePath.split('/').pop()
      if (!packageName) continue

      const sourceFiles = await glob(`${packagePath}/src/**/*.ts`)
      const targetBase = `publish/${packageName}/dist/types`
      
      for (const file of sourceFiles) {
        const relativePath = file.replace(`${packagePath}/src/`, '')
        const targetPath = join(targetBase, relativePath)
        await mkdir(dirname(targetPath), { recursive: true })
        await cp(file, targetPath)
      }
    }

    console.log(`${this.TYPES} Type definitions copied to publish directory`)
  }

  private async mergeTsConfig(packagePath: string): Promise<object> {
    const baseConfigPath = join(process.cwd(), 'packages/tsconfig.base.json')
    const packageConfigPath = join(packagePath, 'tsconfig.json')
    
    console.log(`${this.CLI} Reading base tsconfig from ${baseConfigPath}`)
    const baseConfigContent = await readFile(baseConfigPath, 'utf-8')
    const baseConfig = JSON5.parse(baseConfigContent)
    
    console.log(`${this.CLI} Reading package tsconfig from ${packageConfigPath}`)
    const packageConfigContent = await readFile(packageConfigPath, 'utf-8')
    const packageConfig = JSON5.parse(packageConfigContent)
    
    // Remove extends since we're manually merging
    delete packageConfig.extends
    
    // Deep merge, with package config taking precedence
    const mergedConfig = {
      ...baseConfig,
      compilerOptions: {
        ...baseConfig.compilerOptions,
        ...(packageConfig.compilerOptions || {})
      },
      ...packageConfig
    }

    // Remove baseUrl and paths
    if (mergedConfig.compilerOptions) {
      delete mergedConfig.compilerOptions.baseUrl
      delete mergedConfig.compilerOptions.paths
    }

    // Set include to ["dist"]
    mergedConfig.include = ['dist']
    
    // Remove 'packages/' prefix if it exists in the path
    const cleanPackagePath = packagePath.replace(/^packages\//, '')
    const mergedConfigPath = join('publish', cleanPackagePath, 'tsconfig.json')
    
    await mkdir(dirname(mergedConfigPath), { recursive: true })
    await writeFile(mergedConfigPath, JSON.stringify(mergedConfig, null, 2))
    console.log(`${this.CLI} Generated merged tsconfig at ${mergedConfigPath}`)
    
    return mergedConfig
  }

  private async readPkgJson(pkgPath: string) {
    console.log(`${this.CLI} Reading package.json at ${pkgPath}`)
    const content = await readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(content) as { name: string; version: string; [k: string]: any }
    console.log(`${this.CLI} Parsed package ${pkg.name}@${pkg.version}`)
    return pkg
  }

  private async getWorkspaceDependencies(packagePath: string): Promise<Record<string, string>> {
    const pkgJsonPath = join(packagePath, 'package.json')
    const pkg = await this.readPkgJson(pkgJsonPath)
    
    const workspaceDeps: Record<string, string> = {}
    
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const deps = pkg[field] as Record<string, string>
      if (!deps) continue
      
      for (const [depName, depVersion] of Object.entries(deps)) {
        if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
          workspaceDeps[depName] = depVersion.replace('workspace:', '').replace('../', '')
        }
      }
    }
    
    return workspaceDeps
  }

  private async buildPackage(name: string, path: string): Promise<void> {
    console.log(`${this.CLI} Building package: ${name}`)
    
    // Merge tsconfig before building
    await this.mergeTsConfig(path)

    // Get workspace dependencies
    const workspaceDeps = await this.getWorkspaceDependencies(path)
    console.log(`${this.CLI} Workspace dependencies for ${name}:`, workspaceDeps)

    const plugins: esbuild.Plugin[] = [
      {
        name: 'workspace-resolver',
        setup(build) {
          build.onResolve({ filter: /^@asterflow\// }, (args) => {
            const pkgName = args.path
            if (workspaceDeps[pkgName]) {
              return { external: true }
            }
            return null
          })
        }
      },
      {
        name: 'add-source-comments',
        setup(build) {
          build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
            const contents = await readFile(args.path, 'utf8')
            const relativePath = args.path.split('/src/')[1] || args.path.split(`${path}/`)[1]
            const newContents = `// ${relativePath}\n${contents}`
            return { contents: newContents, loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts' }
          })
        }
      }
    ]

    // Build CJS
    console.log(`${this.CLI} Building CJS for ${name}`)
    await esbuild.build({
      ...this.sharedConfig,
      entryPoints: [`${path}/src/index.ts`],
      outfile: `publish/${name}/dist/cjs/index.cjs`,
      format: 'cjs',
      plugins
    })
    console.log(`${this.CLI} Built CJS for ${name}`)

    // Build ESM
    console.log(`${this.ESM} Building ESM for ${name}`)
    await esbuild.build({
      ...this.sharedConfig,
      entryPoints: [`${path}/src/index.ts`],
      outfile: `publish/${name}/dist/mjs/index.js`,
      format: 'esm',
      plugins
    })
    console.log(`${this.ESM} Built ESM for ${name}`)

    // Copy package assets
    for (const asset of this.assets.filter(a => a !== 'tsconfig.json')) {
      console.log(`${this.CLI} Copying asset: ${asset}`)
      await cp(join(path, asset), `publish/${name}/${asset}`)
    }

    // Write package.json files for type declarations
    await writeFile(`publish/${name}/dist/cjs/package.json`, JSON.stringify({ type: 'commonjs' }, null, 2))
    await writeFile(`publish/${name}/dist/mjs/package.json`, JSON.stringify({ type: 'module' }, null, 2))

    console.log(`${this.CLI} Finished packaging ${name}`)
  }

  private async replaceWorkspaceDeps(publishDir: string): Promise<void> {
    console.log(`${this.CLI} Replacing workspace deps in ${publishDir}`)
    const manifestPath = join(publishDir, 'package.json')
    const pkg = await this.readPkgJson(manifestPath)

    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const deps = pkg[field] as Record<string, string>
      if (!deps) continue

      const toAdd: Record<string, string> = {}

      for (const [depName, depVersion] of Object.entries(deps)) {
        if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
          console.log(`${this.CLI} Found workspace dependency ${depName}: ${depVersion}`)
          const relPath = depVersion.replace(/^workspace:/, '').replace('packages/', '')
          const targetDir = resolve(publishDir, relPath)
          const targetPkg = await this.readPkgJson(join(targetDir, 'package.json'))

          console.log(`${this.CLI} Replacing ${depName}@${depVersion} with ${targetPkg.version}`)
          toAdd[targetPkg.name] = targetPkg.version
        }
      }

      for (const [name, version] of Object.entries(toAdd)) {
        deps[name] = version
      }
    }

    await writeFile(manifestPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    console.log(`${this.CLI} Updated workspace deps in ${publishDir}`)
  }

  public async build(): Promise<void> {
    await this.cleanPublishDirectory()
    
    // Primeiro gera as tipagens
    await this.generateTypes()
    
    const packages = await glob(['packages/*/', 'core'])
    
    // Depois faz o build dos pacotes
    for (const pkg of packages) {
      const name = pkg.split('/')[1] ?? pkg
      await this.buildPackage(name, pkg)
    }
    
    // Copia as tipagens para a pasta publish
    await this.copyTypesToPublish()
    
    // Por fim, atualiza as dependências
    for (const pkg of packages) {
      const name = pkg.split('/')[1] ?? pkg
      await this.replaceWorkspaceDeps(`publish/${name}`)
    }
    
    console.log(`${this.CLI} All packages built and ready for publish!`)
  }
}

// Execute build
const builder = new Builder()
builder.build().catch(console.error)