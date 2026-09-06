import { extname } from 'path'
import { pathToFileURL } from 'url'
import type { AnyRouter } from '@asterflow/router'
import { ROUTE_FILE_EXTENSIONS } from './constants'
import { transformPathToUrl } from './format'
import { getFilesRecursively } from './glob'

/**
 * Scans `routesDir` and `import()`s every route file at call time, assigning
 * `path` from the file location when a route doesn't set one explicitly.
 * Meant for unbundled dev/runtime use (no codegen step required) - the
 * `import()` path is fully dynamic, so a bundler can't trace it. Bundled
 * builds should use `generateRouteManifest` + a static `routes` array
 * instead.
 */
export async function loadRoutesFromDir(routesDir: string): Promise<AnyRouter[]> {
  const allFiles = await getFilesRecursively(routesDir)
  const routeFiles = allFiles
    .filter((file) => ROUTE_FILE_EXTENSIONS.has(extname(file)) && !file.endsWith('.d.ts'))
    .sort()

  const routes: AnyRouter[] = []

  for (const file of routeFiles) {
    const imported: { default?: AnyRouter } = await import(pathToFileURL(file).href)
    const route = imported.default
    if (route == null) continue

    if (!route.path) route.path = transformPathToUrl(file, routesDir)
    routes.push(route)
  }

  return routes
}
