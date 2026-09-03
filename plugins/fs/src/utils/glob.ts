import { readdir } from 'fs/promises'
import { join } from 'path'

/**
 * Recursively lists files from a starting directory.
 * @param dirPath The path to the starting directory.
 * @returns A promise that resolves to an array of file paths.
 */
export async function getFilesRecursively(dirPath: string): Promise<string[]> {
  const dirents = await readdir(dirPath, { withFileTypes: true })

  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = join(dirPath, dirent.name)
      return dirent.isDirectory() ? getFilesRecursively(res) : res
    })
  )

  return files.flat()
}