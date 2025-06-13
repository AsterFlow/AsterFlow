/**
 * Joins two path segments, normalizing slashes to prevent double slashes.
 * @param {string} base - The base path.
 * @param {string} path - The path to be appended to the base.
 * @returns {string} The combined and normalized path.
 */
export function joinPaths(base: string, path: string): string {
  return `${base}${path}`.replace(/\/{2,}/g, '/')
}