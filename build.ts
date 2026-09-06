import { exec } from 'child_process'
import * as esbuild from 'esbuild'
import { existsSync } from 'fs'
import { cp, mkdir, readFile, rename, rm, writeFile } from 'fs/promises'
import { glob } from 'glob'
import JSON5 from 'json5'
import { dirname, join, relative } from 'path'
import { promisify } from 'util'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const execAsync = promisify(exec)

interface PackageInfo {
  name: string
  version: string
  path: string
  publishPath: string
}

interface WorkspaceDependency {
  name: string
  workspacePath: string
  targetVersion: string
}

class PackageRegistry {
  private packages = new Map<string, PackageInfo>()
  
  async discoverPackages(filter?: string): Promise<void> {
    const packagePaths = await glob(['packages/*/', 'plugins/*/', 'core'])
    
    for (const packagePath of packagePaths) {
      const pkgJsonPath = join(packagePath, 'package.json')
      if (!existsSync(pkgJsonPath)) continue
      
      const content = await readFile(pkgJsonPath, 'utf-8')
      const pkg = JSON.parse(content)
      
      const packageName = packagePath.split('/').pop() || packagePath
      const publishPath = `publish/${packageName}`
      
      this.packages.set(pkg.name, {
        name: pkg.name,
        version: pkg.version,
        path: packagePath,
        publishPath
      })
      
      console.log(`📦 Discovered package: ${pkg.name}@${pkg.version} at ${packagePath} -> ${publishPath}`)
    }

    if (filter) {
      // filter may be npm name (@asterflow/fs) or folder name (fs)
      const found = Array.from(this.packages.values()).find(
        (p) => p.name === filter || p.publishPath === `publish/${filter}` || p.path.endsWith(`/${filter}`) || p.path.endsWith(`/${filter}/`)
      )
      if (!found) {
        // Check if filter matches folder under packages/* or plugins/*
        const candidatePaths = [`packages/${filter}/`, `plugins/${filter}/`]
        const matched = candidatePaths.find(cp => existsSync(join(cp, 'package.json')))
        if (matched) {
          console.warn(`⚠️  Filter "${filter}" matched folder ${matched} but not in registry (maybe package.json name differs). Using folder filter.`)
        } else {
          console.error(`\x1b[31mError:\x1b[0m Package '${filter}' not found among discovered packages.`)
          console.error(`Available: ${Array.from(this.packages.values()).map(p => `${p.name} (${p.path})`).join(', ')}`)
          process.exit(1)
        }
      }
    }
  }
  
  getPackageByName(name: string): PackageInfo | undefined {
    return this.packages.get(name)
  }
  
  getAllPackages(filter?: string): PackageInfo[] {
    const all = Array.from(this.packages.values())
    if (!filter) return all
    return all.filter((p) => p.name === filter || p.publishPath === `publish/${filter}` || p.path.endsWith(`/${filter}`) || p.path.endsWith(`/${filter}/`))
  }
  
  resolveWorkspaceDependencies(packagePath: string): Promise<WorkspaceDependency[]> {
    return this.extractWorkspaceDeps(packagePath)
  }
  
  private async extractWorkspaceDeps(packagePath: string): Promise<WorkspaceDependency[]> {
    const pkgJsonPath = join(packagePath, 'package.json')
    const content = await readFile(pkgJsonPath, 'utf-8')
    const pkg = JSON.parse(content)
    
    const workspaceDeps: WorkspaceDependency[] = []
    
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const deps = pkg[field] as Record<string, string>
      if (!deps) continue
      
      for (const [depName, depVersion] of Object.entries(deps)) {
        if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
          const targetPackage = this.getPackageByName(depName)
          if (targetPackage) {
            workspaceDeps.push({
              name: depName,
              workspacePath: depVersion,
              targetVersion: targetPackage.version
            })
          } else {
            console.warn(`⚠️  Workspace dependency ${depName} not found in registry`)
          }
        }
      }
    }
    
    return workspaceDeps
  }
}

class TypeScriptBuilder {
  private readonly TYPES = '\x1b[35mTYPES\x1b[0m'
  
  async generateTypes(): Promise<void> {
    console.log(`${this.TYPES} Generating TypeScript declarations...`)
    
    try {
      if (existsSync('core/dist')) {
        console.log(`${this.TYPES} Cleaning up old dist directory...`)
        await rm('core/dist', { recursive: true })
        console.log(`${this.TYPES} Cleaned dist directory`)
      }

      await execAsync('tsc -p core/tsconfig.build.json --noEmit false')
      console.log(`${this.TYPES} TypeScript declarations generated successfully`)
    } catch (error) {
      console.error(`${this.TYPES} Error generating TypeScript declarations:`, error)
      throw error
    }
  }

  async copyTypesToPublish(): Promise<void> {
    console.log(`${this.TYPES} Copying type definitions to publish directory...`)

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

    const packageGroups = await glob(['core/dist/types/packages/*', 'core/dist/types/plugins/*'])
    for (const packagePath of packageGroups) {
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

      // Also copy source .d.ts files that are not emitted (e.g., augmentation files)
      const possibleSrcs = [`packages/${packageName}`, `plugins/${packageName}`]
      for (const packageSrc of possibleSrcs) {
        if (!existsSync(packageSrc)) continue
        const dtsSources = await glob(`${packageSrc}/src/**/*.d.ts`)
        for (const dtsFile of dtsSources) {
          const relativePath = dtsFile.replace(`${packageSrc}/src/`, '')
          const targetPath = join(targetBase, relativePath)
          // Skip if already copied via emitted types (avoid overwrite with same content)
          if (existsSync(targetPath)) continue
          await mkdir(dirname(targetPath), { recursive: true })
          await cp(dtsFile, targetPath)
          console.log(`${this.TYPES} Copied augmentation d.ts ${dtsFile} -> ${targetPath}`)
        }
      }
    }

    console.log(`${this.TYPES} Type definitions copied to publish directory`)
  }

  async mergeTsConfig(packageInfo: PackageInfo): Promise<void> {
    const CLI = '\x1b[34mCLI\x1b[0m'
    const { path: packagePath, publishPath } = packageInfo
    const baseConfigPath = packagePath.startsWith('plugins/') 
      ? join(process.cwd(), 'plugins/tsconfig.base.json')
      : join(process.cwd(), 'packages/tsconfig.base.json')
    const packageConfigPath = join(packagePath, 'tsconfig.json')
    
    console.log(`${CLI} Reading base tsconfig from ${baseConfigPath}`)
    const baseConfigContent = await readFile(baseConfigPath, 'utf-8')
    const baseConfig = JSON5.parse(baseConfigContent)
    
    console.log(`${CLI} Reading package tsconfig from ${packageConfigPath}`)
    const packageConfigContent = await readFile(packageConfigPath, 'utf-8')
    const packageConfig = JSON5.parse(packageConfigContent)
    
    delete packageConfig.extends
    
    const mergedConfig = {
      ...baseConfig,
      compilerOptions: {
        ...baseConfig.compilerOptions,
        ...(packageConfig.compilerOptions || {})
      },
      ...packageConfig
    }

    if (mergedConfig.compilerOptions) {
      delete mergedConfig.compilerOptions.baseUrl
      delete mergedConfig.compilerOptions.paths
    }

    mergedConfig.include = ['dist']
    
    const mergedConfigPath = join(publishPath, 'tsconfig.json')
    
    await mkdir(dirname(mergedConfigPath), { recursive: true })
    await writeFile(mergedConfigPath, JSON.stringify(mergedConfig, null, 2))
    console.log(`${CLI} Generated merged tsconfig at ${mergedConfigPath}`)
  }
}

class ESBuildBuilder {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'
  private readonly ESM = '\x1b[32mESM\x1b[0m'
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

  async buildPackage(packageInfo: PackageInfo, workspaceDeps: WorkspaceDependency[]): Promise<void> {
    const { name, path, publishPath } = packageInfo
    const dirName = publishPath.replace('publish/', '')
    console.log(`${this.CLI} Building package: ${name}`)

    const plugins = this.createESBuildPlugins(workspaceDeps)
    const cjsOutfile = `${publishPath}/dist/cjs/index.cjs`
    const esmOutfile = `${publishPath}/dist/mjs/index.js`

    console.log(`${this.CLI} Building CJS for ${name}`)
    await esbuild.build({
      ...this.sharedConfig,
      entryPoints: [`${path}/src/index.ts`],
      outfile: cjsOutfile,
      format: 'cjs',
      plugins
    })
    await this.postProcessBundle(cjsOutfile)
    console.log(`${this.CLI} Built CJS for ${name}`)

    console.log(`${this.ESM} Building ESM for ${name}`)
    await esbuild.build({
      ...this.sharedConfig,
      entryPoints: [`${path}/src/index.ts`],
      outfile: esmOutfile,
      format: 'esm',
      plugins
    })
    await this.postProcessBundle(esmOutfile)
    console.log(`${this.ESM} Built ESM for ${name}`)

    await this.copyAssets(path, dirName)

    await writeFile(`${publishPath}/dist/cjs/package.json`, JSON.stringify({ type: 'commonjs' }, null, 2))
    await writeFile(`${publishPath}/dist/mjs/package.json`, JSON.stringify({ type: 'module' }, null, 2))

    console.log(`${this.CLI} Finished packaging ${name}`)
  }

  private createESBuildPlugins(workspaceDeps: WorkspaceDependency[]): esbuild.Plugin[] {
    const workspaceMap = new Map(workspaceDeps.map(dep => [dep.name, dep]))

    return [
      {
        name: 'workspace-resolver',
        setup(build) {
          build.onResolve({ filter: /^@asterflow\// }, (args) => {
            if (workspaceMap.has(args.path)) {
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
            const relativePath = relative(process.cwd(), args.path).replace(/\\/g, '/')
            const sourceComment = `// ${relativePath}\n`

            // A shebang is only recognized by esbuild (and Node) on the file's
            // very first line - prepending the comment ahead of it would push
            // `#!...` to line 2 and turn it into a syntax error. Keep it first.
            const newContents = contents.startsWith('#!')
              ? contents.replace(/^(#!.*\n)/, `$1${sourceComment}`)
              : sourceComment + contents

            return { contents: newContents, loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts' }
          })
        }
      }
    ]
  }
  
  private async postProcessBundle(filePath: string): Promise<void> {
    if (!existsSync(filePath)) return

    let content = await readFile(filePath, 'utf-8')

    // Regex para encontrar:
    // Comentários de bloco (`/* ... */`)
    // Comentários de linha (`// ...`), que são capturados em um grupo
    const commentRegex = /\/\*[\s\S]*?\*\/|(\/\/[^\r\n]*)/g

    content = content.replace(commentRegex, (match, singleLineComment) => {
      // Se `singleLineComment` foi capturado, significa que a regex encontrou um `//`
      if (singleLineComment) {
        // Verificamos se é um comentário de caminho que queremos preservar
        if (singleLineComment.startsWith('// core/') || singleLineComment.startsWith('// packages/') || singleLineComment.startsWith('// plugins/')) {
          return singleLineComment // Mantém o comentário
        }
      }
      // Para todos os outros casos (comentários de bloco ou de linha que não queremos),
      // retorna uma string vazia, efetivamente removendo-os.
      return ''
    })

    // Remove linhas em branco extras que podem ter sido deixadas para trás
    content = content.replace(/^\s*[\r\n]/gm, '')

    await writeFile(filePath, content, 'utf-8')
  }

  private async copyAssets(sourcePath: string, targetDir: string): Promise<void> {
    for (const asset of this.assets.filter(a => a !== 'tsconfig.json')) {
      const sourceFull = join(sourcePath, asset)
      if (existsSync(sourceFull)) {
        console.log(`${this.CLI} Copying asset: ${asset}`)
        await cp(sourceFull, `publish/${targetDir}/${asset}`)
      }
    }

    // Static, non-code assets a package's runtime code reads back (e.g. `@asterflow/cli`'s
    // scaffold templates) - copied as-is, one level up from `dist/`, so a package can resolve
    // them relative to its own root regardless of whether its bundle is cjs or mjs.
    const templatesDir = join(sourcePath, 'templates')
    if (existsSync(templatesDir)) {
      console.log(`${this.CLI} Copying asset: templates/`)
      await cp(templatesDir, `publish/${targetDir}/templates`, { recursive: true })
    }
  }
}

class DependencyManager {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'
  
  constructor(private registry: PackageRegistry) {}

  async replaceWorkspaceDependencies(packageInfo: PackageInfo): Promise<void> {
    const { publishPath, name } = packageInfo
    console.log(`${this.CLI} Replacing workspace dependencies in ${name}`)
    
    const manifestPath = join(publishPath, 'package.json')
    const content = await readFile(manifestPath, 'utf-8')
    const pkg = JSON.parse(content)

    let hasChanges = false

    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const deps = pkg[field] as Record<string, string>
      if (!deps) continue

      for (const [depName, depVersion] of Object.entries(deps)) {
        if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
          console.log(`${this.CLI} Found workspace dependency ${depName}: ${depVersion}`)
          
          const targetPackage = this.registry.getPackageByName(depName)
          if (targetPackage) {
            // A caret range, not an exact pin: an internal dependency should be able to
            // absorb a compatible patch/minor release of another AsterFlow package without
            // this package needing to be republished too - see VERSIONING.md.
            const range = `^${targetPackage.version}`
            console.log(`${this.CLI} Replacing ${depName}@${depVersion} with ${range}`)
            deps[depName] = range
            hasChanges = true
          } else {
            console.warn(`⚠️  Cannot resolve workspace dependency: ${depName}`)
          }
        }
      }
    }

    if (hasChanges) {
      await writeFile(manifestPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
      console.log(`${this.CLI} Updated workspace dependencies in ${name}`)
    } else {
      console.log(`${this.CLI} No workspace dependencies to update in ${name}`)
    }
  }

  async validateNoWorkspaceRemains(packageInfo: PackageInfo): Promise<boolean> {
    const manifestPath = join(packageInfo.publishPath, 'package.json')
    const content = await readFile(manifestPath, 'utf-8')
    if (content.includes('workspace:')) {
      console.error(`\x1b[31mError:\x1b[0m workspace: protocol still present in ${manifestPath}`)
      return false
    }
    return true
  }
}

class LocalPacker {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'

  async packPackage(packageInfo: PackageInfo): Promise<void> {
    console.log(`  🥡 Packing ${packageInfo.name} for local installation...`)
    const publishPath = join(process.cwd(), packageInfo.publishPath)

    try {
      const { stdout } = await execAsync('bun pm pack', { cwd: publishPath })

      const tgzFileName = stdout
        .split('\n')
        .find(line => line.endsWith('.tgz'))
        ?.trim()

      if (!tgzFileName) {
        throw new Error(`Could not determine packed file name from \`bun pm pack\` output.\nReceived: ${stdout}`)
      }

      const sourceTgzPath = join(publishPath, tgzFileName)
      const localPackagesDir = join(process.cwd(), 'local-packages')
      await mkdir(localPackagesDir, { recursive: true })
      const targetTgzPath = join(localPackagesDir, tgzFileName)

      await rename(sourceTgzPath, targetTgzPath)

      console.log('  ✅ Packed successfully!')
      console.log(`  📂 File created: \x1b[32m${targetTgzPath}\x1b[0m`)
      console.log(`  💡 To install, run: \x1b[36mbun add ${targetTgzPath}\x1b[0m`)
    } catch (error) {
      console.error(`  \x1b[31mError:\x1b[0m Failed to pack ${packageInfo.name}.`, error)
    }
  }
}

class Builder {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'
  private registry = new PackageRegistry()
  private tsBuilder = new TypeScriptBuilder()
  private esBuildBuilder = new ESBuildBuilder()
  private dependencyManager = new DependencyManager(this.registry)
  private localPacker = new LocalPacker()

  private async cleanPublishDirectory(filter?: string): Promise<void> {
    if (filter) {
      const filtered = this.registry.getAllPackages(filter)
      for (const pkg of filtered) {
        if (existsSync(pkg.publishPath)) {
          console.log(`${this.CLI} Cleaning publish directory for ${pkg.name}: ${pkg.publishPath}`)
          await rm(pkg.publishPath, { recursive: true })
        }
      }
      // Ensure we still clean core/dist/types for filtered builds to avoid stale
      return
    }
    console.log(`${this.CLI} Cleaning up old publish directory...`)
    if (existsSync('publish')) await rm('publish', { recursive: true })
    console.log(`${this.CLI} Cleaned publish directory`)
  }

  public async build(options: { packageFilter?: string; isLocal?: boolean } = {}): Promise<void> {
    const { packageFilter, isLocal } = options
    const action = isLocal ? 'local packaging' : 'build'
    console.log(`${this.CLI} 🚀 Starting modular ${action} process...${packageFilter ? ` (filter: ${packageFilter})` : ''}`)
    
    await this.registry.discoverPackages(packageFilter)
    await this.cleanPublishDirectory(packageFilter)
    await this.tsBuilder.generateTypes()
    
    const packages = this.registry.getAllPackages(packageFilter)
    if (packages.length === 0) {
      console.error(`\x1b[31mError:\x1b[0m No packages matched filter "${packageFilter}"`)
      process.exit(1)
    }
    
    for (const packageInfo of packages) {
      console.log(`\n${this.CLI} ═══ Building ${packageInfo.name} ═══`)
       
      await this.tsBuilder.mergeTsConfig(packageInfo)
       
      const workspaceDeps = await this.registry.resolveWorkspaceDependencies(packageInfo.path)
      console.log(`${this.CLI} Workspace dependencies for ${packageInfo.name}:`, 
        workspaceDeps.map(dep => `${dep.name}@${dep.targetVersion}`))
       
      await this.esBuildBuilder.buildPackage(packageInfo, workspaceDeps)
    }
    
    await this.tsBuilder.copyTypesToPublish()
    
    console.log(`\n${this.CLI} ═══ Updating workspace dependencies ═══`)
    for (const packageInfo of packages) {
      await this.dependencyManager.replaceWorkspaceDependencies(packageInfo)
    }

    // Validation: ensure no workspace: remains in publish
    let hasWorkspaceLeak = false
    for (const packageInfo of packages) {
      const ok = await this.dependencyManager.validateNoWorkspaceRemains(packageInfo)
      if (!ok) hasWorkspaceLeak = true
    }
    if (hasWorkspaceLeak) {
      console.error('\x1b[31mBuild failed: workspace: protocol leaked into publish manifests\x1b[0m')
      process.exit(1)
    }

    if (isLocal) {
      console.log(`\n${this.CLI} ═══ Packing for local install ═══`)
      for (const packageInfo of packages) {
        await this.localPacker.packPackage(packageInfo)
      }
    }
    
    console.log(`\n${this.CLI} ✅ All packages built and ready for publish!`)
    console.log(`${this.CLI} Built packages:`)
    packages.forEach(pkg => {
      console.log(`${this.CLI}   • ${pkg.name}@${pkg.version}`)
    })
  }
}

// CLI
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
      package: {
        alias: 'p',
        type: 'string',
        describe: 'Package folder or npm name to build (e.g., fs, @asterflow/fs, adapter)',
        demandOption: false
      },
      local: {
        type: 'boolean',
        describe: 'Pack built packages into local-packages/*.tgz via bun pm pack',
        default: false
      }
    })
    .help()
    .alias('help', 'h')
    .parse()

  const builder = new Builder()
  await builder.build({ packageFilter: argv.package as string | undefined, isLocal: argv.local as boolean })
}

main().catch((error) => {
  console.error('Build failed:', error)
  process.exit(1)
})
