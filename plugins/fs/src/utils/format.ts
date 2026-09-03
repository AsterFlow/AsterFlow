import { relative } from 'path'

/**
 * Transforms a file path into a robustly formatted URL route.
 */
export function transformPathToUrl(filePath: string, rootDir: string): string {
  const relativePath = relative(rootDir, filePath)
  let url = relativePath.replace(/\.(ts|js)$/, '')

  // users/index -> users
  if (url.endsWith('/index')) url = url.slice(0, -6)
  // index -> ''
  else if (url === 'index') url = ''

  // users/$id -> users/:id
  url = url.replace(/\$/g, ':')

  return `/${url}`
}