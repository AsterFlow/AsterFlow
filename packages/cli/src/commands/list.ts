import chalk from 'chalk'
import { PLUGIN_REGISTRY } from '../registry/plugins'

export function runList(): void {
  console.log(chalk.bold('\nAvailable AsterFlow plugins:\n'))

  for (const plugin of Object.values(PLUGIN_REGISTRY)) {
    console.log(`  ${chalk.cyan(plugin.id.padEnd(12))} ${chalk.gray(plugin.packageName)}`)
    console.log(`  ${' '.repeat(12)} ${plugin.description}\n`)
  }

  console.log(chalk.gray(`Install with: asterflow add <name>[,<name>...]\n`))
}
