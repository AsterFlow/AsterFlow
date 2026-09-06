import { lstatSync, readdirSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

/** Files/folders that don't block scaffolding into an existing, non-empty directory. */
const ALLOWED_ENTRIES = new Set([
  '.DS_Store',
  '.git',
  '.gitattributes',
  '.gitignore',
  '.gitlab-ci.yml',
  '.hg',
  '.hgcheck',
  '.hgignore',
  '.idea',
  '.npmignore',
  '.vscode',
  'LICENSE',
  'Thumbs.db'
])

/** Reports (and prints) whether `root` is safe to scaffold into - empty, or containing only files from `ALLOWED_ENTRIES`. */
export function isFolderEmpty(root: string, name: string): boolean {
  const conflicts = readdirSync(root).filter((entry) => !ALLOWED_ENTRIES.has(entry) && !entry.endsWith('.iml'))

  if (conflicts.length === 0) return true

  console.log(`The directory ${chalk.green(name)} contains files that could conflict:`)
  console.log()
  for (const entry of conflicts) {
    const isDirectory = lstatSync(join(root, entry)).isDirectory()
    console.log(`  ${chalk.cyan(entry)}${isDirectory ? '/' : ''}`)
  }
  console.log()
  console.log('Either try using a new directory name, or remove the files listed above.')
  console.log()

  return false
}
