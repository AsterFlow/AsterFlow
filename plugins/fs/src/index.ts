import { Plugin } from '@asterflow/plugin'
import { Method, Router, type AnyRouter } from '@asterflow/router'
import * as pkg from '../package.json'
import { transformPathToUrl } from './utils/format'
import { getFilesRecursively } from './utils/glob'
import { logWarning } from './utils/log'

export * from './utils/format'
export * from './utils/glob'
export * from './types/asterflow.d'

export type FSRoutingContext = {
  path: string
  files: string[]
  creator: string,
  version: string,
}

export const fsRoutingPlugin = Plugin
  .create({ name: 'fs-routing' })
  .decorate('creator', 'Ashu11-A')
  .decorate('version', pkg.version) 
  .config({ path: '' })
  .derive('files', async (context) => await getFilesRecursively(context.path))
  .extends((instance, ctx) => ({
    async registerRoutes (context: typeof ctx) {
      if (context.files.length === 0) return

      for (const file of context.files) {
        const routeModule = await import(file) as { default?: AnyRouter }
        const exported = routeModule.default

        if (!exported) {
          logWarning('File Skipped: No Default Export', {
            File: file,
            Reason: 'The file does not contain any default exported routes (export default).',
            Solution: 'Ensure the file has a "export default new Router()" or similar.'
          })
          continue
        }

        if (!(exported instanceof Method || exported instanceof Router)) {
          logWarning('File Skipped: Invalid Export Type', {
            File: file,
            'Exported Type': typeof exported,
            Reason: 'The file does not export a known class instance (e.g., Router, Method).'
          })
          continue
        }

        if (!exported.path) exported.path = transformPathToUrl(file, context.path)

          instance.controller(exported)
      }
    }
  }))
  .on('beforeInitialize', async (instance, context) => await instance.registerRoutes(context))

export default fsRoutingPlugin