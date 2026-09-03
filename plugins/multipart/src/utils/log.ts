const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
}

export function debug(...args: unknown[]) {
  if (process.env.DEBUG === 'true') {
    console.log(`${colors.blue}[AsterFlow Multipart]${colors.reset}`, ...args)
  }
}

export function logError(title: string, error: unknown) {
  console.error(`${colors.red}%s %s${colors.reset}`, '[AsterFlow Multipart]', title)
  console.group()
  console.error('Error:', error instanceof Error ? error.message : error)
  if (error instanceof Error && 'code' in error) console.error('Code:', (error as { code: unknown }).code)
  console.groupEnd()
}
