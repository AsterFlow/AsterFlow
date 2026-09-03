import chalk from 'chalk'
import { exec as execChild } from 'child_process'
import { glob } from 'glob'

const exec = async (command: string, directory: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = execChild(`cd ${directory} && ${command}`)

    child.stdout?.on('data', (output) => process.stdout.write(chalk.gray(output)))
    child.stderr?.on('data', (output) => process.stderr.write(chalk.red(output)))

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Command failed: ${command} in ${directory}`))
      }
      return resolve()
    })
  })
}

// Unified workspace list: root + all publishable packages + examples
const patterns = ['./', 'packages/*', 'plugins/*', 'core', 'example', 'benchmark']
const packages = await glob(patterns)

console.log(chalk.blue(`Found ${packages.length} workspaces: ${packages.join(', ')}`))

let hasError = false
for (const pkg of packages) {
  try {
    console.log(chalk.cyan(`\n══ Updating ${pkg} ══`))
    await exec('bun update', pkg)
  } catch (error) {
    hasError = true
    console.error(chalk.red(`Error updating package ${pkg}: ${(error as Error).message}`))
  }
}

if (hasError) {
  console.error(chalk.red('\nSome packages failed to update. Check logs above.'))
  console.error(chalk.yellow('This helps identify which package breaks with new dependency versions.'))
} else {
  console.log(chalk.green('\nAll workspaces updated successfully.'))
}
