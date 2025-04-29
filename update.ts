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

const packages = await glob(['./', 'packages/*', 'core'])


for (const pkg of packages) {
  try {
    await exec('bun update', pkg)
  } catch (error) {
    console.error(chalk.red(`Erro ao atualizar o pacote ${pkg}: ${(error as Error).message}`))
  }
}