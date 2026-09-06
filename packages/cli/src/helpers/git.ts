import { execSync } from 'child_process'
import { rmSync } from 'fs'
import { join } from 'path'

function isInGitRepository(cwd: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function isDefaultBranchSet(cwd: string): boolean {
  try {
    execSync('git config init.defaultBranch', { cwd, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** Initializes a git repo at `root` with an initial commit. No-op (returns false) if git is missing or `root` is already inside a repo. */
export function tryGitInit(root: string): boolean {
  let didInit = false
  try {
    execSync('git --version', { stdio: 'ignore' })
    if (isInGitRepository(root)) return false

    execSync('git init', { cwd: root, stdio: 'ignore' })
    didInit = true

    if (!isDefaultBranchSet(root)) {
      execSync('git checkout -b main', { cwd: root, stdio: 'ignore' })
    }

    execSync('git add -A', { cwd: root, stdio: 'ignore' })
    execSync('git commit -m "Initial commit from create-asterflow-app"', { cwd: root, stdio: 'ignore' })
    return true
  } catch {
    if (didInit) {
      try {
        rmSync(join(root, '.git'), { recursive: true, force: true })
      } catch {
        // ignore
      }
    }
    return false
  }
}
