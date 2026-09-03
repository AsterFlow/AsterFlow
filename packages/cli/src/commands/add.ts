import { exec } from 'child_process'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { promisify } from 'util'
import { PLUGIN_REGISTRY } from '../registry/plugins'
import { log } from '../utils/log'
import { addCommand, detectPackageManager } from '../utils/packageManager'

const execAsync = promisify(exec)

export interface AddOptions {
  names: string
  directory?: string
}

export async function runAdd({ names, directory }: AddOptions): Promise<void> {
  const targetDir = resolve(directory ?? '.')
  const pkgPath = join(targetDir, 'package.json')

  const requested = names.split(',').map((name) => name.trim()).filter(Boolean)
  if (requested.length === 0) {
    log.error('No plugin names given. Usage: asterflow add fs,multipart')
    process.exitCode = 1
    return
  }

  const unknown = requested.filter((id) => !PLUGIN_REGISTRY[id])
  if (unknown.length > 0) {
    log.error(`Unknown plugin${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`)
    log.step(`Available plugins: ${Object.keys(PLUGIN_REGISTRY).join(', ')}`)
    process.exitCode = 1
    return
  }

  if (!existsSync(pkgPath)) {
    log.error(`No package.json found at ${pkgPath}. Run this from an AsterFlow project (or \`asterflow init\` first).`)
    process.exitCode = 1
    return
  }

  const plugins = requested.map((id) => PLUGIN_REGISTRY[id]!)

  const pkgRaw = await readFile(pkgPath, 'utf-8')
  const pkg = JSON.parse(pkgRaw) as { dependencies?: Record<string, string> }
  pkg.dependencies ??= {}

  const alreadyPresent = plugins.filter((plugin) => pkg.dependencies![plugin.packageName])
  const toAdd = plugins.filter((plugin) => !pkg.dependencies![plugin.packageName])

  for (const plugin of toAdd) pkg.dependencies![plugin.packageName] = plugin.version
  pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies!).sort(([a], [b]) => a.localeCompare(b)))

  if (toAdd.length > 0) {
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    log.success(`Added to package.json: ${toAdd.map((plugin) => plugin.packageName).join(', ')}`)

    const manager = detectPackageManager(targetDir)
    const command = addCommand(manager, toAdd.map((plugin) => plugin.packageName))
    log.info(`Installing (${command})...`)
    try {
      await execAsync(command, { cwd: targetDir })
      log.success('Dependencies installed.')
    } catch (error) {
      log.error(`Install failed - run manually: ${command}`)
      log.step(error instanceof Error ? error.message : String(error))
    }
  }

  if (alreadyPresent.length > 0) {
    log.warn(`Already present, skipped: ${alreadyPresent.map((plugin) => plugin.packageName).join(', ')}`)
  }

  log.info('Wire it up:')
  for (const plugin of plugins) {
    log.step(`import { ${plugin.importName} } from '${plugin.packageName}'`)
    log.step(`app${plugin.useSnippet}`)
    log.step(plugin.usageNote)
  }
}
