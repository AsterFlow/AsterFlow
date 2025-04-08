export function joinPaths(base: string, path: string): string {
  return `${base}${path}`.replace(/\/{2,}/g, '/');
}