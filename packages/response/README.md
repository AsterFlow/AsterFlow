<div align="center">

# @asterflow/response

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=packages%2Fresponse&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/response?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Type-safe HTTP response builder with status-code helpers, header/cookie management, and binary file responses.

## 📦 Installation

```bash
bun install @asterflow/response
```

### ✨ Features

- **Typed status codes** — `response.status(code)` narrows the accepted body type to what that code expects
- **Shorthand helpers** — `success`, `created`, `noContent`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `validationError`, `internalServerError`
- **JSON responses** — `.json(data)` sends the body and sets `Content-Type: application/json`
- **Binary/file responses** — `.file(data, contentType?)` sends a `Uint8Array` as raw bytes; without a `contentType`, it's detected from the data's magic bytes (PNG, JPEG, GIF, PDF, BMP, ICO, GZIP, ZIP, WEBP), falling back to `application/octet-stream`
- **Headers and cookies** — `setHeader`/`setCookie`, each chainable and reflected in the response's type
- **Runtime conversion** — `toResponse()` for the standard Web `Response`, `toServerResponse(res)` for Node's `http.ServerResponse`

## ❓ How to Use

```ts
import { AsterResponse } from '@asterflow/response'

const response = new AsterResponse()
  .status(201)
  .setHeader('X-Request-Id', 'abc123')
  .json({ id: 1, name: 'User' })
```

Sending a file works the same way — pass the bytes, and the content type is sniffed automatically if you don't already know it:

```ts
import { readFile } from 'fs/promises'
import { AsterResponse } from '@asterflow/response'

const data = await readFile('avatar.png')
const response = new AsterResponse().file(data) // Content-Type: image/png
```

Convert the finished response for whichever runtime you're on: `response.toResponse()` or `response.toServerResponse(res)`.

## 🔗 Related Packages

- Depended on by [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) — builds error responses and passes `AsterResponse` to its runtime adapters
- Depended on by [@asterflow/multipart](https://www.npmjs.com/package/@asterflow/multipart) — returns `AsterResponse` errors for malformed multipart requests
- Depended on by [asterflow](https://www.npmjs.com/package/asterflow) — the core framework's request handler works with `AsterResponse`

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
