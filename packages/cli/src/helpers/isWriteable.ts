import { constants } from 'fs'
import { access } from 'fs/promises'

export async function isWriteable(directory: string): Promise<boolean> {
  try {
    await access(directory, constants.W_OK)
    return true
  } catch {
    return false
  }
}
