import { exec } from 'child_process'
import type { Plugin } from 'esbuild'
import { existsSync } from 'fs'
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { glob } from 'glob'
import JSON5 from 'json5'
import { dirname, join } from 'path'
import { build, type Options } from 'tsup'
import { promisify } from 'util'

type PackageInfo = {
  name: string
  version: string
  path: string
  publishPath: string
}

const execAsync = promisify(exec)

class Builder {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'
  private readonly TYPES = '\x1b[35mTYPES\x1b[0m'

  private readonly paths: string[]
  private readonly publishDir: string
  private readonly assetsToCopy: string[]
  private readonly registry = new Map<string, PackageInfo>()

  constructor(paths: string[], publishDir: string = 'publish') {
    this.paths = paths
    this.publishDir = publishDir
    this.assetsToCopy = ['README.md', 'package.json']
  }

  /**
   * Executa todo o processo de build e publicação.
   */
  async run(): Promise<void> {
    console.log(`${this.CLI} Iniciando o processo de publicação.`)
    await this.cleanPublishDir()
    await this.discoverPackages()
    await this.generateTypes()

    for (const packageInfo of this.registry.values()) {
      // O core é um caso especial, processado por generateTypes e copyTypesToPublish
      if (packageInfo.name === 'core') continue

      console.log(`\n📦 Processando pacote: \x1b[33m${packageInfo.name}\x1b[0m`)
      await this.processPackage(packageInfo)
      console.log(`  ✨ Finalizado: ${packageInfo.name}.`)
    }

    await this.copyTypesToPublish()
    console.log(`\n${this.CLI} Todos os pacotes foram processados com sucesso.`)
  }

  /**
   * Limpa o diretório de publicação.
   */
  private async cleanPublishDir(): Promise<void> {
    if (existsSync(this.publishDir)) {
      console.log(`${this.CLI} Limpando diretório de publicação existente: ${this.publishDir}`)
      await rm(this.publishDir, { recursive: true })
    }
  }

  /**
   * Descobre todos os pacotes no workspace e os armazena no registro.
   */
  private async discoverPackages(): Promise<void> {
    console.log(`${this.CLI} Descobrindo pacotes do workspace...`)
    const packagePatterns = this.paths.map(p => join(p, 'package.json').replace(/\\/g, '/'))
    const packageJsonPaths = await glob(packagePatterns)

    for (const packageJsonPath of packageJsonPaths) {
      const packagePath = dirname(packageJsonPath)
      try {
        const pkgContent = await readFile(packageJsonPath, 'utf-8')
        const parsedPkg = JSON.parse(pkgContent)
        const pkgName = parsedPkg.name
        const pkgVersion = parsedPkg.version
        const publishDirName = packagePath.split('/').pop() ?? pkgName

        if (pkgName && pkgVersion) {
          const info: PackageInfo = {
            name: pkgName,
            version: pkgVersion,
            path: packagePath,
            publishPath: join(this.publishDir, publishDirName)
          }
          this.registry.set(pkgName, info)
          console.log(`  🔍 Descoberto: ${pkgName}@${pkgVersion}`)
        }
      } catch (error) {
        console.error(`  \x1b[31mErro:\x1b[0m Não foi possível ler ou analisar ${packageJsonPath}:`, error)
      }
    }
  }

  /**
   * Processa um único pacote: build, cópia de assets e substituição de dependências.
   */
  private async processPackage(packageInfo: PackageInfo): Promise<void> {
    const { path } = packageInfo

    const sharedConfig: Options = {
      platform: 'node',
      entry: [join(path, 'src/index.ts')],
      bundle: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      skipNodeModulesBundle: true,
      clean: true,
      dts: false,
      tsconfig: join(path, 'tsconfig.json'),
      esbuildPlugins: this.createESBuildPlugins()
    }

    await this.buildPackage(packageInfo.name, sharedConfig)
    await this.copyAssets(packageInfo)
    await this.replaceWorkspaceDependencies(packageInfo)
    await this.mergeTsConfig(packageInfo)
  }

  /**
   * Realiza o build de um pacote para os formatos CJS e ESM.
   */
  private async buildPackage(packageName: string, sharedConfig: Options): Promise<void> {
    const publishPath = this.registry.get(packageName)?.publishPath
    if (!publishPath) {
      console.error(`  \x1b[31mErro:\x1b[0m Caminho de publicação não encontrado para ${packageName}`)
      return
    }

    console.log(`  Construindo CJS para ${packageName}...`)
    await build({
      ...sharedConfig,
      format: 'cjs',
      outDir: join(publishPath, 'dist', 'cjs')
    })

    console.log(`  Construindo ESM para ${packageName}...`)
    await build({
      ...sharedConfig,
      format: 'esm',
      outDir: join(publishPath, 'dist', 'mjs'),
      splitting: true
    })

    await writeFile(join(publishPath, 'dist/cjs/package.json'), JSON.stringify({ type: 'commonjs' }, null, 2))
    await writeFile(join(publishPath, 'dist/mjs/package.json'), JSON.stringify({ type: 'module' }, null, 2))
  }

  /**
   * Copia assets (como package.json e README) para o diretório de publicação.
   */
  private async copyAssets(packageInfo: PackageInfo): Promise<void> {
    for (const asset of this.assetsToCopy) {
      const sourceFull = join(packageInfo.path, asset)
      const targetFull = join(packageInfo.publishPath, asset)
      if (existsSync(sourceFull)) {
        await mkdir(dirname(targetFull), { recursive: true })
        console.log(`  Copiando asset: ${asset} para ${targetFull}`)
        await cp(sourceFull, targetFull)
      } else {
        console.log(`  Pulando asset: ${asset} (não encontrado em ${sourceFull})`)
      }
    }
  }

  /**
   * Substitui as dependências "workspace:*" pelas versões reais dos pacotes.
   */
  private async replaceWorkspaceDependencies(packageInfo: PackageInfo): Promise<void> {
    const { publishPath, name } = packageInfo
    console.log(`${this.CLI} Substituindo dependências do workspace em ${name}`)

    const manifestPath = join(publishPath, 'package.json')
    if (!existsSync(manifestPath)) {
      console.warn(`⚠️  Não é possível substituir dependências, package.json não encontrado em: ${manifestPath}`)
      return
    }

    const content = await readFile(manifestPath, 'utf-8')
    const pkg = JSON.parse(content)
    let hasChanges = false

    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const deps = pkg[field] as Record<string, string>
      if (!deps) continue

      for (const [depName, depVersion] of Object.entries(deps)) {
        if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
          console.log(`  Encontrada dependência do workspace ${depName}: ${depVersion}`)
          const targetPackage = this.registry.get(depName)
          if (targetPackage) {
            const newVersion = `^${targetPackage.version}`
            console.log(`  Substituindo ${depName}@${depVersion} por ${newVersion}`)
            deps[depName] = newVersion
            hasChanges = true
          } else {
            console.warn(`⚠️  Não foi possível resolver a dependência do workspace: ${depName}`)
          }
        }
      }
    }

    if (hasChanges) {
      await writeFile(manifestPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
      console.log(`${this.CLI} Dependências do workspace atualizadas em ${name}`)
    } else {
      console.log(`${this.CLI} Nenhuma dependência do workspace para atualizar em ${name}`)
    }
  }

  /**
   * Gera os tipos TypeScript para todos os pacotes.
   */
  async generateTypes(): Promise<void> {
    console.log(`${this.TYPES} Gerando declarações TypeScript...`)
    try {
      if (existsSync('core/dist')) {
        await rm('core/dist', { recursive: true })
      }
      await execAsync('cd core && tsc -p tsconfig.build.json')
      console.log(`${this.TYPES} Declarações TypeScript geradas com sucesso.`)
    } catch (error) {
      console.error(`${this.TYPES} Erro ao gerar declarações TypeScript:`, error)
      throw error
    }
  }

  /**
   * Copia os arquivos de definição de tipos para seus respectivos diretórios de publicação.
   */
  async copyTypesToPublish(): Promise<void> {
    console.log(`${this.TYPES} Copiando definições de tipo para os diretórios de publicação...`)
    for (const packageInfo of this.registry.values()) {
      const typesSourceDir = join('core/dist/types', packageInfo.path, 'src')
      const typesTargetDir = join(packageInfo.publishPath, 'dist/types')

      if (existsSync(typesSourceDir)) {
        console.log(`  Copiando tipos de ${typesSourceDir} para ${typesTargetDir}`)
        await mkdir(typesTargetDir, { recursive: true })
        await cp(typesSourceDir, typesTargetDir, { recursive: true })
      } else {
        console.log(`  Tipos não encontrados para ${packageInfo.name} em ${typesSourceDir}`)
      }
    }
    console.log(`${this.TYPES} Definições de tipo copiadas.`)
  }
  
  /**
   * Mescla o tsconfig.base.json com o tsconfig.json do pacote.
   */
  private async mergeTsConfig(packageInfo: PackageInfo): Promise<void> {
    const { path: packageSourcePath, publishPath, name } = packageInfo
    const packageConfigPath = join(packageSourcePath, 'tsconfig.json')

    if (!existsSync(packageConfigPath)) {
      console.warn(`${this.CLI} \x1b[33mWarning:\x1b[0m Nenhum tsconfig.json encontrado para \x1b[36m${name}\x1b[0m.`)
      return
    }

    try {
      const baseConfigContent = await readFile('packages/tsconfig.base.json', 'utf-8')
      const packageConfigContent = await readFile(packageConfigPath, 'utf-8')
      const baseConfig = JSON5.parse(baseConfigContent)
      const packageConfig = JSON5.parse(packageConfigContent)
      
      delete packageConfig.extends

      const mergedConfig: any = {
        ...baseConfig,
        ...packageConfig,
        compilerOptions: {
          ...baseConfig.compilerOptions,
          ...(packageConfig.compilerOptions || {})
        }
      }

      delete mergedConfig.compilerOptions.paths
      delete mergedConfig.compilerOptions.baseUrl

      mergedConfig.include = ['dist']
      mergedConfig.exclude = ['node_modules']
      
      if (mergedConfig.compilerOptions) {
        const typesPath = './dist/types'
        mergedConfig.compilerOptions.paths = {
          [packageInfo.name]: [typesPath],
          [`${packageInfo.name}/*`]: [`${typesPath}/*`]
        }
        mergedConfig.compilerOptions.declaration = true
        mergedConfig.compilerOptions.declarationMap = true
      }

      const mergedConfigPath = join(publishPath, 'tsconfig.json')
      await writeFile(mergedConfigPath, JSON.stringify(mergedConfig, null, 2))
      console.log(`${this.CLI} tsconfig.json mesclado gerado em ${mergedConfigPath}`)
    } catch (error) {
      console.error(`${this.CLI} \x1b[31mErro:\x1b[0m Falha ao mesclar tsconfig para ${name}:`, error)
    }
  }

  /**
   * Cria plugins customizados do esbuild para resolver dependências do workspace.
   */
  private createESBuildPlugins(): Plugin[] {
    return [
      {
        name: 'workspace-resolver',
        setup: (build) => {
          build.onResolve({ filter: /@asterflow\// }, (args) => {
            if (this.registry.has(args.path)) {
              return { path: args.path, external: true }
            }
            return null
          })
        }
      }
    ]
  }
}

const paths = ['packages/*', 'core']
const builder = new Builder(paths)
builder.run().catch((error) => {
  console.error('\x1b[31mBuild falhou:\x1b[0m', error)
  process.exit(1)
})
