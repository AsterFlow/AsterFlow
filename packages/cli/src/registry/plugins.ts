export interface PluginDefinition {
  id: string
  packageName: string
  version: string
  description: string
  /** Binding name imported from the plugin's package, e.g. `multipartPlugin`. */
  importName: string
  /** Appended as a `.use(...)` call in the generated `app` chain. */
  useSnippet: string
  /** Printed by `add`/`init` after wiring - anything the user still has to do by hand. */
  usageNote: string
}

export const PLUGIN_REGISTRY: Record<string, PluginDefinition> = {
  fs: {
    id: 'fs',
    packageName: '@asterflow/fs',
    version: '^1.0.7',
    description: 'File system-based routing - routes are discovered from a routes/ directory.',
    importName: 'fsRoutingPlugin',
    useSnippet: '.use(fsRoutingPlugin, { routes })',
    usageNote: 'Run `asterflow generate` (or `asterflow generate --watch`) after adding/removing files under src/routes/ - it writes src/routes.gen.ts, which the app entry imports as `routes`.'
  },
  multipart: {
    id: 'multipart',
    packageName: '@asterflow/multipart',
    version: '^1.0.0',
    description: 'multipart/form-data parsing (file uploads), with per-route type-safe field criteria.',
    importName: 'multipartPlugin',
    useSnippet: '.use(multipartPlugin, { limits: { fileSize: 10 * 1024 * 1024 } })',
    usageNote: 'Build upload routes with Method.create(Method.POST).multipart({...}).handler(...) - see src/routes/upload.ts for a working example.'
  }
}

export const PLUGIN_IDS = Object.keys(PLUGIN_REGISTRY)
