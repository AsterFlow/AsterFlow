<div align="center">

# @asterflow/multipart

![license-info](https://img.shields.io/github/license/AsterFlow/plugins?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/plugins?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/multipart?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Multipart form-data parsing plugin for AsterFlow, built on [busboy](https://github.com/mscdex/busboy).

## 📦 Installation

```bash
# You can use any package manager
npm install @asterflow/multipart
```

## 💡 About

`@asterflow/multipart` detects `multipart/form-data` requests and parses them with `busboy` before your route handler runs. Fields and files are attached directly to `request` (`request.body`, `request.files`, `request.getFile(...)`, etc.) — no wrapper object to dig through.

Routes can also declare per-field upload criteria (MIME types, extensions, size, required, multiple) right on `Method`/`Router`. That criteria is validated **before your handler runs** and **drives the TypeScript types of `getFile`/`getFiles` in that same handler** — a field marked `required` types as always-present, and a field with a declared `mimeTypes` list narrows `.mimeType` to that literal union.

## ✨ Features

- **Automatic Processing** — any `multipart/form-data` request is parsed before it reaches your route.
- **Type-Safe Per-Route Criteria** — declare `multipart: {...}` on a route and get compile-time-checked `getFile`/`getFiles`, plus automatic runtime validation with standardized error responses.
- **Full MIME Type Autocomplete** — `MimeType` is a ~2300-entry union generated from IANA's official registries, with an escape hatch for custom/vendor types.
- **True Streaming** — files are streamed straight into memory or straight to disk; large uploads are never buffered twice.
- **Configurable Limits** — field/file size, field/file/part counts, all enforced by busboy itself.
- **Automatic Cleanup** — temp files written to disk are removed automatically after the response is sent.
- **Works Across Adapters** — Node, Bun, Express and Fastify are all supported (see the Fastify note below).

## 🚀 Quick Start

```typescript
import { AsterFlow } from 'asterflow'
import { multipartPlugin } from '@asterflow/multipart'

const app = new AsterFlow()
  .use(multipartPlugin)
  .listen({ port: 3333 })
```

## 📖 Usage

### 1. Register the Plugin

```typescript
import { AsterFlow } from 'asterflow'
import { multipartPlugin } from '@asterflow/multipart'

export const app = new AsterFlow()
  .use(multipartPlugin, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5
    }
  })
```

### 2. Type-Safe Per-Route Criteria (recommended)

`@asterflow/router`'s `Method`/`Router` ship with an extensible builder (`Method.create(...)`/`Router.builder(...)`) specifically so plugins can add chainable methods like `.multipart(...)` without `packages/router` needing to know anything about multipart — nothing about this feature appears anywhere unless your project actually imports `@asterflow/multipart`. Build the route with the chain, then register it with `app.controller(...)`:

```typescript
import { Method } from '@asterflow/router'
// Importing @asterflow/multipart (for the plugin, or even just its types)
// is what makes `.multipart(...)` exist on the chain below.
import { multipartPlugin } from '@asterflow/multipart'

const uploadRoute = Method.create({ path: '/upload', method: 'post' })
  .multipart({
    avatar: { mimeTypes: ['image/png', 'image/jpeg'], maxSize: 5 * 1024 * 1024, required: true },
    attachments: { extensions: ['.pdf'], multiple: true }
  })
  .handler(({ request, response }) => {
    // `avatar` is required -> typed as always-present, no `undefined` check.
    // `.mimeType` is narrowed to 'image/png' | 'image/jpeg'.
    const avatar = request.getFile('avatar')

    // `attachments` allows multiple files.
    const attachments = request.getFiles('attachments')

    // request.getFile('somethingElse') is a compile error - only field names
    // declared in `.multipart(...)` above are valid here, with editor autocomplete.

    return response.success({
      avatar: { name: avatar.filename, size: avatar.size, type: avatar.mimeType },
      attachmentCount: attachments.length
    })
  })

app.controller(uploadRoute)
```

If the request fails this criteria (missing required field, wrong MIME type, too many files, oversized file, or isn't even `multipart/form-data`), the plugin rejects it with a standardized error response **before your handler runs** — see [Standardized Errors](#-standardized-errors) below.

`Router.builder(...).method(key, ...)` declares criteria per HTTP method, the same way `schema` already works on a plain `Router` - a method with no `.multipart(...)` call gets the untyped fallback instead:

```typescript
import { Router } from '@asterflow/router'
import { multipartPlugin } from '@asterflow/multipart'

app.controller(
  Router.builder({ path: '/upload' })
    .method('post', (b) => b
      .multipart({ avatar: { required: true } })
      .handler(({ request }) => { /* request.getFile('avatar') is typed */ }))
    .method('get', (b) => b
      .handler(({ request }) => { /* untyped fallback - no .multipart() called for GET */ }))
    .build()
)
```

`Method.create(...).multipart(...)`/`Router.builder(...)` return genuine `Method`/`Router` instances (`instanceof Method`/`instanceof Router` both hold) — they work with `plugins/fs`'s dynamic route discovery too, e.g. `export default Method.create({...}).multipart({...}).handler(...)` in a route file.

### 3. Untyped Usage (no per-route criteria)

Without a `multipart:` option, `request.getFile`/`getFiles`/etc. are still available, just optional and unnarrowed (any field name, `MultipartFile | undefined`):

```typescript
import { Method } from '@asterflow/router'

export default new Method({
  method: 'post',
  async handler({ request, response }) {
    if (!request.hasFiles?.()) {
      return response.badRequest({ error: 'NO_FILES', fields: request.body })
    }

    const savedPaths = await request.saveAll!('./uploads')

    return response.success({
      metadata: request.multipartMetadata,
      files: request.files!.map((file) => ({
        fieldName: file.fieldName,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimeType
      })),
      fields: request.body,
      savedPaths
    })
  }
})
```

### 4. Configuration Options

```typescript
app.use(multipartPlugin, {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,      // 1MB per field
    fields: Infinity,
    fileSize: 50 * 1024 * 1024,  // 50MB per file
    files: 10,
    parts: Infinity
  },
  fileHandling: {
    keepInMemory: false,          // stream to disk instead of buffering in memory
    tempDir: './tmp'              // defaults to os.tmpdir()
  },
  validation: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    validator: async (file) => file.mimeType.startsWith('image/')
  }
})
```

This global config applies to every request the plugin parses. Per-route `multipart` criteria (§2) is checked *in addition to* this — a route can be stricter than the global config, but not more permissive than it.

## ⚠️ Standardized Errors

Every failure mode — global config limits/validation, per-route criteria, and malformed requests — resolves through the same `{ error, code, message, details? }` shape:

| Cause | Status | `code` |
|---|---|---|
| Any size/count limit exceeded | 413 | `LIMIT_FILE_SIZE`, `LIMIT_FILE_COUNT`, `LIMIT_FIELD_SIZE`, `LIMIT_FIELD_COUNT`, `LIMIT_PARTS` |
| Disallowed MIME type / extension | 415 | `INVALID_MIME_TYPE`, `INVALID_EXTENSION` |
| Global `validation.validator` returned false, or a required/too-many-files per-route violation | 422 | `VALIDATION_FAILED`, `FIELD_REQUIRED`, `FIELD_TOO_MANY_FILES` |
| Malformed request / not `multipart/form-data` on a route that declared criteria | 400 | `PARSE_ERROR` or `MULTIPART_ERROR` |

## ⚠️ Fastify note

AsterFlow's Fastify adapter runs behind Fastify's own body-parsing lifecycle. Fastify has no built-in parser for `multipart/form-data` and will reject the request before it reaches AsterFlow unless you tell it to leave the raw stream alone:

```typescript
fastify.addContentTypeParser('multipart/form-data', (_request, payload, done) => done(null))
```

Node, Bun and Express need no such workaround — the plugin reads the raw stream directly.

## 🗺️ API Reference

### Request Extensions

- `request.body` — parsed form fields (`Record<string, string | string[]>`)
- `request.files` — array of processed files
- `request.multipartMetadata` — `{ processingTime, totalSize, fieldsCount, filesCount }`
- `request.getFile(fieldName)` — first file for a field. On a route that declared `multipart` criteria, `fieldName` is constrained (with autocomplete) to that route's declared field names, and the result is typed as always-present (no `undefined`) when the field is `required`; otherwise `MultipartFile | undefined`. On a route without declared criteria, this is the ambient fallback: any string, `MultipartFile | undefined`.
- `request.getFiles(fieldName)` — all files for a field. Same field-name constraint as `getFile` on routes with declared criteria.
- `request.hasFiles()` — whether any files were uploaded.
- `request.getFilesByType(mimeType)` — files filtered by MIME type.
- `request.saveAll(directory)` — saves every file into `directory`, returns the written paths.
- `request.cleanupMultipart()` — removes any temp files on disk; called automatically after the response is sent.

All of the above are optional on the ambient fallback type (routes without declared `multipart` criteria) and only actually present at runtime when the request was `multipart/form-data`. A route that declares `multipart` criteria gets non-optional, narrowed versions of `getFile`/`getFiles` instead.

### `multipart` Route Option

```typescript
interface MultipartFieldCriteria {
  mimeTypes?: readonly MimeType[]   // full IANA-generated union, plus custom strings
  extensions?: readonly string[]    // e.g. ['.png', '.jpg']
  maxSize?: number                  // bytes
  required?: boolean                // default false
  multiple?: boolean                // default false - allow more than one file for this field
}

type MultipartFields = Record<string, MultipartFieldCriteria>
```

### File Object

```typescript
interface MultipartFile {
  fieldName: string
  filename: string
  encoding: string
  mimeType: string
  size: number
  extension: string
  buffer?: Buffer      // set when fileHandling.keepInMemory is true
  tempPath?: string    // set when fileHandling.keepInMemory is false

  toBuffer(): Promise<Buffer>
  save(path: string): Promise<void>
  stream(): NodeJS.ReadableStream
}
```

### Standalone Parsing

The parser can also be used outside the plugin hook, e.g. in tests or custom pipelines:

```typescript
import { parseMultipart, MultipartParser } from '@asterflow/multipart'

const result = await parseMultipart(request, { limits: { fileSize: 1024 } })

// or, with lifecycle events:
const parser = new MultipartParser(config, {
  onFileStart: (file) => console.log('start', file.filename),
  onFileEnd: (file) => console.log('done', file.filename, file.size)
})
const result = await parser.parse(request)
```

## 🔗 Related Packages

- [asterflow](https://www.npmjs.com/package/asterflow) - The core of the AsterFlow framework.
- [@asterflow/plugin](https://www.npmjs.com/package/@asterflow/plugin) - The main plugin system.
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - The type-safe routing system.

## 📄 License

MIT - See the main project [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.
