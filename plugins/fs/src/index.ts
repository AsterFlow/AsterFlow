import { Plugin } from '@asterflow/plugin'
import { Method, Router, type AnyRouter } from '@asterflow/router'
import * as pkg from '../package.json'
import { logWarning } from './utils/log'

export * from './utils/codegen'
export * from './utils/format'
export * from './utils/glob'
export * from './types/asterflow.d'

export const fsRoutingPlugin = Plugin
  .create({ name: 'fs-routing' })
  .decorate('creator', 'Ashu11-A')
  .decorate('version', pkg.version)
  .config({ routes: [] as AnyRouter[] })
  .extends((instance, ctx) => ({
    registerRoutes (context: typeof ctx) {
      for (const route of context.routes) {
        if (!(route instanceof Method || route instanceof Router)) {
          logWarning('Route Skipped: Invalid Entry', {
            'Exported Type': typeof route,
            Reason: 'An entry in the generated route manifest is not a Router/Method instance.',
            Solution: 'Re-run `asterflow generate` - if the problem persists, check the route file\'s default export.'
          })
          continue
        }

        instance.controller(route)
      }
    }
  }))
  .on('beforeInitialize', (instance, context) => instance.registerRoutes(context))

export default fsRoutingPlugin
