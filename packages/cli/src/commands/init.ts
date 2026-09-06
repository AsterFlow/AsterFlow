import * as p from '@clack/prompts'
import isCI from 'ci-info'
import { exec } from 'child_process'
import { appendFile, mkdir, writeFile } from 'fs/promises'
import { basename, dirname, join, resolve } from 'path'
import { promisify } from 'util'
import { generateEntry } from '../generators/appEntry'
import { generatePackage } from '../generators/packageJson'
import { generateRoutes } from '../generators/routes'
import { copyTemplate } from '../helpers/copyTemplate'
import { tryGitInit } from '../helpers/git'
import { isFolderEmpty } from '../helpers/isFolderEmpty'
import { isWriteable } from '../helpers/isWriteable'
import { validateProjectName } from '../helpers/validateProjectName'
import { ADAPTER_IDS, ADAPTER_REGISTRY } from '../registry/adapters'
import { PLUGIN_REGISTRY } from '../registry/plugins'
import { availableTemplates, TEMPLATE_IDS } from '../registry/templates'
import type { PackageManager } from '../utils/packageManager'
import { detectPackageManager, installCommand, resolvePackageManager } from '../utils/packageManager'

const execAsync = promisify(exec)

export interface InitOptions {
  directory?: string
  name?: string
  adapter?: string
  /** Comma-separated plugin ids, e.g. "fs,multipart" - same style as `asterflow add`. */
  plugins?: string
  /** Comma-separated route template ids, e.g. "hello,upload", or "none" - same style as `plugins`. */
  routes?: string
  install?: boolean
  git?: boolean
  packageManager?: PackageManager
  /** Accept defaults for anything not explicitly set, without prompting - even with zero other flags. */
  yes?: boolean
}

const DEFAULTS = {
  adapter: 'bun',
  // Both plugins, not none: a bare `new AsterFlow()` with no routing story
  // isn't a useful starting point, and these two together are what the
  // example routes below are written to demonstrate.
  plugins: ['fs', 'multipart'],
  install: true,
  git: true
}

export async function runInit(options: InitOptions): Promise<void> {
  p.intro('Create a new AsterFlow project')

  const targetDir = resolve(options.directory ?? '.')
  const defaultName = basename(targetDir) === '.' ? 'my-asterflow-app' : basename(targetDir)

  if (!(await isWriteable(dirname(targetDir)))) {
    p.cancel(`The path ${targetDir} is not writable. Check folder permissions and try again.`)
    process.exitCode = 1
    return
  }

  await mkdir(targetDir, { recursive: true })
  if (!isFolderEmpty(targetDir, basename(targetDir))) {
    process.exitCode = 1
    return
  }

  // Mirrors create-next-app: any `--flag` on the command line means "don't
  // interrupt with prompts" - fill in documented defaults for whatever
  // wasn't explicitly passed instead. Critical for agents/CI that pass a
  // couple of flags and expect the rest to just work, not hang on a prompt.
  const hasProvidedOptions = process.argv.some((arg) => arg.startsWith('--'))
  const skipPrompts = isCI.isCI || Boolean(options.yes) || hasProvidedOptions
  // Only explain assumed defaults when *some* flags were given but not
  // others - `--yes`/CI mean "just do it", not "explain what you picked".
  const explainDefaults = hasProvidedOptions && !options.yes && !isCI.isCI

  if (options.name) {
    const validation = validateProjectName(options.name)
    if (!validation.valid) {
      p.cancel(`Invalid project name "${options.name}":\n${validation.problems.map((problem) => `  - ${problem}`).join('\n')}`)
      process.exitCode = 1
      return
    }
  }

  let name = options.name
  if (name === undefined) {
    if (skipPrompts) {
      name = defaultName
    } else {
      const res = await p.text({
        message: 'Project name',
        placeholder: defaultName,
        defaultValue: defaultName,
        validate: (value) => {
          const validation = validateProjectName(value || defaultName)
          return validation.valid ? undefined : `Invalid project name: ${validation.problems[0]}`
        }
      })
      if (p.isCancel(res)) return p.cancel('Cancelled.')
      name = res
    }
  }

  if (options.adapter && !ADAPTER_REGISTRY[options.adapter]) {
    p.cancel(`Unknown adapter "${options.adapter}". Available: ${ADAPTER_IDS.join(', ')}`)
    process.exitCode = 1
    return
  }

  let adapterId = options.adapter
  if (!adapterId) {
    if (skipPrompts) {
      adapterId = DEFAULTS.adapter
    } else {
      const res = await p.select({
        message: 'Which adapter do you want to use?',
        options: Object.values(ADAPTER_REGISTRY).map((adapter) => ({ value: adapter.id, label: adapter.label })),
        initialValue: DEFAULTS.adapter
      })
      if (p.isCancel(res)) return p.cancel('Cancelled.')
      adapterId = res
    }
  }

  let pluginIds: string[]
  if (options.plugins !== undefined) {
    pluginIds = options.plugins.split(',').map((id) => id.trim()).filter(Boolean)
    const unknown = pluginIds.filter((id) => !PLUGIN_REGISTRY[id])
    if (unknown.length > 0) {
      p.cancel(`Unknown plugin${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Available: ${Object.keys(PLUGIN_REGISTRY).join(', ')}`)
      process.exitCode = 1
      return
    }
  } else if (skipPrompts) {
    pluginIds = DEFAULTS.plugins
  } else {
    const res = await p.multiselect({
      message: 'Which plugins do you want to install? (space to select, enter to confirm)',
      options: Object.values(PLUGIN_REGISTRY).map((plugin) => ({ value: plugin.id, label: plugin.packageName, hint: plugin.description })),
      initialValues: DEFAULTS.plugins,
      required: false
    })
    if (p.isCancel(res)) return p.cancel('Cancelled.')
    pluginIds = res
  }
  // Deselecting everything (or `--plugins ''`) falls back to the defaults
  // rather than scaffolding a project with no routing story at all.
  if (pluginIds.length === 0) pluginIds = DEFAULTS.plugins

  const usableTemplates = availableTemplates(pluginIds)

  let templateIds: string[]
  if (options.routes !== undefined) {
    const requested = options.routes.split(',').map((id) => id.trim()).filter(Boolean)
    templateIds = requested.includes('none') ? [] : requested
    const unknown = templateIds.filter((id) => !usableTemplates.some((template) => template.id === id))
    if (unknown.length > 0) {
      p.cancel(`Unknown route template${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Available: ${usableTemplates.map((template) => template.id).join(', ')}`)
      process.exitCode = 1
      return
    }
  } else if (skipPrompts) {
    templateIds = usableTemplates.map((template) => template.id)
  } else {
    const res = await p.multiselect({
      message: 'Which example routes do you want to scaffold? (space to select, enter to confirm)',
      options: usableTemplates.map((template) => ({ value: template.id, label: template.path, hint: template.summary })),
      initialValues: usableTemplates.map((template) => template.id),
      required: false
    })
    if (p.isCancel(res)) return p.cancel('Cancelled.')
    templateIds = res
  }

  let install = options.install
  if (install === undefined) {
    if (skipPrompts) {
      install = DEFAULTS.install
    } else {
      const res = await p.confirm({ message: 'Install dependencies now?', initialValue: DEFAULTS.install })
      if (p.isCancel(res)) return p.cancel('Cancelled.')
      install = res
    }
  }

  let git = options.git
  if (git === undefined) {
    if (skipPrompts) {
      git = DEFAULTS.git
    } else {
      const res = await p.confirm({ message: 'Initialize a git repository?', initialValue: DEFAULTS.git })
      if (p.isCancel(res)) return p.cancel('Cancelled.')
      git = res
    }
  }

  if (explainDefaults) {
    printDefaults({
      adapter: options.adapter === undefined,
      plugins: options.plugins === undefined,
      routes: options.routes === undefined,
      install: options.install === undefined,
      git: options.git === undefined
    }, { adapterId, pluginIds, templateIds, install, git })
  }

  const adapter = ADAPTER_REGISTRY[adapterId]!
  const plugins = pluginIds.map((id) => PLUGIN_REGISTRY[id]!)

  const spinner = p.spinner()
  spinner.start('Scaffolding project')

  const srcDir = join(targetDir, 'src')
  await mkdir(srcDir, { recursive: true })

  await writeFile(join(targetDir, 'package.json'), await generatePackage({ name, adapter, plugins }))
  await copyTemplate('tsconfig.json', join(targetDir, 'tsconfig.json'))
  await writeFile(join(srcDir, 'index.ts'), generateEntry({ adapter, plugins, stub: templateIds.length > 0 }))

  await copyTemplate('gitignore', join(targetDir, '.gitignore'))
  const usesFs = plugins.some((plugin) => plugin.id === 'fs')
  if (usesFs) await appendFile(join(targetDir, '.gitignore'), 'src/routes.gen.ts\n')

  const routeFiles = await generateRoutes({ pluginIds, templateIds })
  if (routeFiles.length > 0) {
    const routesDir = join(srcDir, 'routes')
    await mkdir(routesDir, { recursive: true })
    for (const file of routeFiles) {
      const filePath = join(routesDir, file.fileName)
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, file.content)
    }
  }

  spinner.stop('Project scaffolded')

  const packageManager = resolvePackageManager(options.packageManager, targetDir)

  if (install) {
    const command = installCommand(packageManager)
    const installSpinner = p.spinner()
    installSpinner.start(`Installing dependencies (${command})`)
    try {
      await execAsync(command, { cwd: targetDir })
      installSpinner.stop('Dependencies installed')
    } catch (error) {
      installSpinner.stop('Failed to install dependencies')
      p.log.error(error instanceof Error ? error.message : String(error))
    }
  }

  if (git) {
    if (tryGitInit(targetDir)) {
      p.log.success('Initialized a git repository.')
    }
  }

  for (const plugin of plugins) {
    p.log.info(`${plugin.packageName}: ${plugin.usageNote}`)
  }

  printSuccess({ name, targetDir, packageManager, useYarn: packageManager === 'yarn' })
}

function printDefaults(
  assumed: { adapter: boolean, plugins: boolean, routes: boolean, install: boolean, git: boolean },
  values: { adapterId: string, pluginIds: string[], templateIds: string[], install: boolean, git: boolean }
): void {
  const lines: string[] = []
  if (assumed.adapter) lines.push(`  --adapter <id>   ${values.adapterId}  (available: ${ADAPTER_IDS.join(', ')})`)
  if (assumed.plugins) lines.push(`  --plugins <ids>  ${values.pluginIds.length > 0 ? values.pluginIds.join(',') : 'none'}  (available: ${Object.keys(PLUGIN_REGISTRY).join(', ')})`)
  if (assumed.routes) lines.push(`  --routes <ids>   ${values.templateIds.length > 0 ? values.templateIds.join(',') : 'none'}  (available: ${TEMPLATE_IDS.join(', ')})`)
  if (assumed.install) lines.push(`  --no-install     skip installing dependencies  (default: ${values.install ? 'installs' : 'skips'})`)
  if (assumed.git) lines.push(`  --no-git         skip git init  (default: ${values.git ? 'inits' : 'skips'})`)

  if (lines.length === 0) return
  p.note(lines.join('\n'), 'Using defaults for unprovided options')
}

function printSuccess({ name, targetDir, packageManager, useYarn }: { name: string, targetDir: string, packageManager: PackageManager, useYarn: boolean }): void {
  const runDev = `${packageManager} ${useYarn ? '' : 'run '}dev`
  p.note(`cd ${targetDir}\n${runDev}`, 'Next steps')
  p.outro(`Success! Created ${name} at ${targetDir}`)
}
