import { existsSync } from 'fs'
import { join } from 'path'

export type PackageManager = 'bun' | 'pnpm' | 'yarn' | 'npm'

const LOCKFILES: Record<string, PackageManager> = {
  'bun.lock': 'bun',
  'bun.lockb': 'bun',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm'
}

/** Detects the package manager in use for `cwd`, based on lockfiles present, defaulting to `bun`. */
export function detectPackageManager(cwd: string): PackageManager {
  for (const [lockfile, manager] of Object.entries(LOCKFILES)) {
    if (existsSync(join(cwd, lockfile))) return manager
  }
  return 'bun'
}

export function installCommand(manager: PackageManager): string {
  return manager === 'yarn' ? 'yarn' : `${manager} install`
}

export function addCommand(manager: PackageManager, packages: string[]): string {
  const list = packages.join(' ')
  switch (manager) {
    case 'bun': return `bun add ${list}`
    case 'pnpm': return `pnpm add ${list}`
    case 'yarn': return `yarn add ${list}`
    case 'npm': return `npm install ${list}`
  }
}
