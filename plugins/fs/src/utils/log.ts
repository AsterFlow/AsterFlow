const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

export function logWarning(title: string, details: Record<string, string>) {
  console.warn(`${colors.yellow}%s %s${colors.reset}`, '[AsterFlow]', title)
  console.group()
  for (const [key, value] of Object.entries(details)) {
    console.log(`${colors.cyan}%s:${colors.reset} %s`, key, value)
  }
  console.groupEnd()
  console.log()
}