import chalk from 'chalk'

export const log = {
  info: (message: string) => console.log(chalk.cyan(message)),
  success: (message: string) => console.log(chalk.green(message)),
  warn: (message: string) => console.log(chalk.yellow(message)),
  error: (message: string) => console.error(chalk.red(message)),
  step: (message: string) => console.log(chalk.gray(`  ${message}`))
}
