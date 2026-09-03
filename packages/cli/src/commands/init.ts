import * as p from '@clack/prompts'
import { exec } from 'child_process'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { basename, join, resolve } from 'path'
import { promisify } from 'util'
import { ADAPTER_REGISTRY } from '../registry/adapters'
import { PLUGIN_REGISTRY } from '../registry/plugins'
import { generateAppEntry } from '../templates/appEntry'
import { generatePackageJson } from '../templates/packageJson'
import { generateTsconfigJson } from '../templates/tsconfigJson'
import { detectPackageManager, installCommand } from '../utils/packageManager'

const execAsync = promisify(exec)

export interface InitOptions {
  directory?: string
}

export async function runInit({ directory }: InitOptions): Promise<void> {
  p.intro('Create a new AsterFlow project')

  const targetDir = resolve(directory ?? '.')
  const defaultName = basename(targetDir) === '.' ? 'my-asterflow-app' : basename(targetDir)

  if (existsSync(targetDir) && existsSync(join(targetDir, 'package.json'))) {
    const overwrite = await p.confirm({
      message: `${join(targetDir, 'package.json')} already exists - continue and overwrite generated files?`,
      initialValue: false
    })
    if (p.isCancel(overwrite) || !overwrite) return p.cancel('Cancelled.')
  }

  const name = await p.text({
    message: 'Project name',
    placeholder: defaultName,
    defaultValue: defaultName
  })
  if (p.isCancel(name)) return p.cancel('Cancelled.')

  const adapterId = await p.select({
    message: 'Which adapter do you want to use?',
    options: Object.values(ADAPTER_REGISTRY).map((adapter) => ({
      value: adapter.id,
      label: adapter.label
    })),
    initialValue: 'bun'
  })
  if (p.isCancel(adapterId)) return p.cancel('Cancelled.')

  const pluginIds = await p.multiselect({
    message: 'Which plugins do you want to install? (space to select, enter to confirm)',
    options: Object.values(PLUGIN_REGISTRY).map((plugin) => ({
      value: plugin.id,
      label: plugin.packageName,
      hint: plugin.description
    })),
    required: false
  })
  if (p.isCancel(pluginIds)) return p.cancel('Cancelled.')

  const exampleRoutes = await p.confirm({
    message: 'Generate example routes?',
    initialValue: true
  })
  if (p.isCancel(exampleRoutes)) return p.cancel('Cancelled.')

  const shouldInstall = await p.confirm({
    message: 'Install dependencies now?',
    initialValue: true
  })
  if (p.isCancel(shouldInstall)) return p.cancel('Cancelled.')

  const adapter = ADAPTER_REGISTRY[adapterId]
  const plugins = pluginIds.map((id) => PLUGIN_REGISTRY[id]).filter((plugin) => plugin !== undefined)

  if (!adapter) {
    p.cancel(`Unknown adapter "${adapterId}".`)
    return
  }

  const spinner = p.spinner()
  spinner.start('Scaffolding project')

  await mkdir(targetDir, { recursive: true })
  await writeFile(join(targetDir, 'package.json'), generatePackageJson({ name, adapter, plugins }))
  await writeFile(join(targetDir, 'tsconfig.json'), generateTsconfigJson())
  await writeFile(join(targetDir, 'index.ts'), generateAppEntry({ adapter, plugins, exampleRoutes }))
  await writeFile(join(targetDir, '.gitignore'), 'node_modules\ndist\n.env\n')

  if (exampleRoutes) {
    const routesWithExamples = plugins.filter((plugin) => plugin.exampleRoute)
    if (routesWithExamples.length > 0) {
      const routesDir = join(targetDir, 'routes')
      await mkdir(routesDir, { recursive: true })
      for (const plugin of routesWithExamples) {
        await writeFile(join(routesDir, plugin.exampleRoute!.fileName), plugin.exampleRoute!.content)
      }
    }
  }

  spinner.stop('Project scaffolded')

  if (shouldInstall) {
    const manager = detectPackageManager(targetDir)
    const command = installCommand(manager)
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

  for (const plugin of plugins) {
    p.log.info(`${plugin.packageName}: ${plugin.usageNote}`)
  }

  p.outro(`Done. cd into your project and run \`bun run index.ts\` (or your adapter's dev command) to start.`)
}
