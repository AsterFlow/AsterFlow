<div align="center">

# @asterflow/multipart

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=plugins%2Fmultipart&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/multipart?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Parses `multipart/form-data` requests before your handler runs, with optional per-route field rules that are checked at runtime and enforced in the handler's types.

## 📦 Installation

```bash
bun install @asterflow/multipart
```

Register the plugin on an AsterFlow app:

```ts
import { AsterFlow } from 'asterflow'
import { multipartPlugin } from '@asterflow/multipart'

const app = new AsterFlow()
  .use(multipartPlugin, { limits: { fileSize: 10 * 1024 * 1024 } })
```

### ✨ Features

- **Automatic parsing** - any `multipart/form-data` request is parsed with `busboy` before it reaches your route.
- **Per-route criteria** - calling `.multipart({...})` on `Method.create(...)` (or inside a `Router.builder(...).method(...)` chain) validates fields at runtime and narrows `getFile`/`getFiles` in that handler's types - a `required` field types as always-present, a declared `mimeTypes` list narrows `.mimeType`.
- **Request extensions** - `request.body`, `request.files`, `request.getFile()`, `request.getFiles()`, `request.hasFiles()`, `request.getFilesByType()`, `request.saveAll()` and `request.cleanupMultipart()` are attached directly onto `request`, no wrapper object.
- **Streaming storage** - files stream into memory or to disk (`fileHandling.keepInMemory`), never buffered twice.
- **Automatic cleanup** - temp files written to disk are removed after the response is sent.
- **Standardized errors** - limit, MIME/extension and required-field failures all reject with the same `{ error, code, message }` shape before your handler runs.

## ❓ How to Use

Declare a route's fields with `.multipart(schema)` - the handler only runs once the request passes that schema, and `getFile`/`getFiles` are typed to match it:

```ts
import { Method } from '@asterflow/router'

export default Method.create(Method.POST, { path: '/avatar' })
  .multipart({
    avatar: { mimeTypes: ['image/png', 'image/jpeg'], maxSize: 5 * 1024 * 1024, required: true }
  })
  .handler(({ request, response }) => {
    const avatar = request.getFile('avatar') // always present, mimeType narrowed
    return response.success({ filename: avatar.filename, size: avatar.size })
  })
```

Without a declared schema, the same methods are still there on `request`, just optional and unnarrowed:

```ts
export default Method.create(Method.POST, { path: '/upload' }).handler(({ request, response }) => {
  if (!request.hasFiles?.()) return response.badRequest({ error: 'NO_FILES' })
  return response.success({ files: request.files, fields: request.body })
})
```

## 🔗 Related Packages

- [@asterflow/plugin](https://www.npmjs.com/package/@asterflow/plugin) - built as a plugin with `Plugin.create()`
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - adds `.multipart(...)` to `Method` and `RouteMethodBuilder` via declaration merging
- [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - extends `AsterRequest` via `.extend()` to attach parsed multipart data
- [@asterflow/response](https://www.npmjs.com/package/@asterflow/response) - returns `AsterResponse` errors for malformed or rejected multipart requests

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
