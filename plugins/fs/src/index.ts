import { Plugin } from '@asterflow/plugin'
import { Method, Router, type AnyRouter } from '@asterflow/router'
import * as pkg from '../package.json'
import { loadRoutesFromDir } from './utils/loader'
import { logWarning } from './utils/log'

export * from './utils/codegen'
export * from './utils/format'
export * from './utils/glob'
export * from './utils/loader'
export * from './types/asterflow.d'

export const fsRoutingPlugin = Plugin
  .create({ name: 'fs-routing' })
  .decorate('creator', 'Ashu11-A')
  .decorate('version', pkg.version)
  .config({
    // Static mode: a pre-generated manifest (see `generateRouteManifest`),
    // safe for bundled/production builds.
    routes: undefined as AnyRouter[] | undefined,
    // Dynamic mode: scans and `import()`s this directory at `beforeInitialize`,
    // no codegen step needed. Not bundler-safe - dev/unbundled runs only.
    path: undefined as string | undefined
  })
  .extends((instance, ctx) => ({
    registerRoutes (routes: AnyRouter[]) {
      for (const route of routes) {
        if (!(route instanceof Method || route instanceof Router)) {
          logWarning('Route Skipped: Invalid Entry', {
            'Exported Type': typeof route,
            Reason: 'An entry in the route list is not a Router/Method instance.',
            Solution: 'Check the route file\'s default export - if using a static manifest, re-run `asterflow generate`.'
          })
          continue
        }

        instance.controller(route)
      }
    }
  }))
  .on('beforeInitialize', async (instance, context) => {
    if (context.path && context.routes) {
      logWarning('Ambiguous fs-routing Config', {
        Reason: 'Both `routes` and `path` were provided.',
        Solution: 'Pass only one: `path` for dynamic (dev) loading, or `routes` for a pre-generated static manifest. `path` will be used.'
      })
    }

    const routes = context.path
      ? await loadRoutesFromDir(context.path)
      : context.routes ?? []

    instance.registerRoutes(routes)
  })

export default fsRoutingPlugin
