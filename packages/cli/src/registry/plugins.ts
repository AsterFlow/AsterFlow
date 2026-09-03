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
  /** Written under `routes/` when the user opts into example routes during `init`. */
  exampleRoute?: {
    fileName: string
    content: string
  }
}

export const PLUGIN_REGISTRY: Record<string, PluginDefinition> = {
  fs: {
    id: 'fs',
    packageName: '@asterflow/fs',
    version: '^1.0.7',
    description: 'File system-based routing - routes are discovered from a routes/ directory.',
    importName: 'fsRouting',
    useSnippet: `.use(fsRouting, { path: join(process.cwd(), 'routes') })`,
    usageNote: 'Route files placed under routes/ are picked up automatically - see routes/index.example.ts.',
    exampleRoute: {
      fileName: 'index.example.ts',
      content: `import { Method } from '@asterflow/router'

// Rename this file to index.ts (or drop the .example suffix) to activate it.
// @asterflow/fs turns file paths under routes/ into URL routes - see its
// README for the full convention (index.ts -> /, $id.ts -> /:id, etc).
export default new Method({
  path: '/',
  method: 'get',
  handler({ response }) {
    return response.success({ message: 'Hello from file system routing!' })
  }
})
`
    }
  },
  multipart: {
    id: 'multipart',
    packageName: '@asterflow/multipart',
    version: '^1.0.0',
    description: 'multipart/form-data parsing (file uploads), with per-route type-safe field criteria.',
    importName: 'multipartPlugin',
    useSnippet: `.use(multipartPlugin, { limits: { fileSize: 10 * 1024 * 1024 } })`,
    usageNote: 'Build upload routes with Method.create({...}).multipart({...}).handler(...) - see routes/upload.example.ts.',
    exampleRoute: {
      fileName: 'upload.example.ts',
      content: `import { Method } from '@asterflow/router'

// Rename this file to drop the .example suffix to activate it (with
// @asterflow/fs), or import it directly and pass it to app.controller(...).
//
// .multipart({...}) declares per-field upload criteria: the plugin validates
// the request against it before this handler runs, and getFile/getFiles are
// typed accordingly (required fields are non-optional, mimeTypes narrow
// \`.mimeType\`).
export default Method.create({ path: '/upload', method: 'post' })
  .multipart({
    avatar: { mimeTypes: ['image/png', 'image/jpeg'], maxSize: 5 * 1024 * 1024, required: true }
  })
  .handler(({ request, response }) => {
    const avatar = request.getFile('avatar')

    return response.success({
      filename: avatar.filename,
      mimeType: avatar.mimeType,
      size: avatar.size
    })
  })
`
    }
  }
}

export const PLUGIN_IDS = Object.keys(PLUGIN_REGISTRY)
