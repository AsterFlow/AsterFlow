<div align="center">

# @asterflow/request

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=packages%2Frequest&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/request?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Wraps the native request object of Bun, Node, Express, or Fastify into one typed `AsterRequest`, so the rest of AsterFlow reads requests the same way regardless of runtime.

## 📦 Installation

```bash
bun install @asterflow/request
```

### ✨ Features

- **`AsterRequest`** - a single class with `getBody()`, `getHeaders()`, `getMethod()`, `getPathname()`, and a parsed `url` (from `@asterflow/url-parser`), no matter which runtime produced it.
- **Runtime factories** - `createBunRequest`, `createNodeRequest`, `createExpressRequest`, and `createFastifyRequest` each adapt their native request object into an `AsterRequest`.
- **Body parsing per runtime** - Bun and Node read and parse the raw body (JSON or `x-www-form-urlencoded`); Express and Fastify reuse the body their own middleware already parsed.
- **`.extend(extension)`** - attaches extra typed properties to a request instance (used by plugins like multipart to add parsed file data) and returns the widened type.
- **Typed by `Runtime`** - `AsterRequest<Drive>` is generic over the `Runtime` enum from `@asterflow/adapter`, so `raw` is typed as the correct native request for that runtime.

## ❓ How to Use

Adapt a native request to `AsterRequest` and read from it the same way regardless of runtime:

```ts
import { createBunRequest } from '@asterflow/request'

Bun.serve({
  async fetch(req) {
    const request = createBunRequest(req)

    const body = await request.getBody()
    const { pathname } = request.url // parsed by @asterflow/url-parser
  }
})
```

Swap the factory and the rest of the code stays the same:

```ts
import { createExpressRequest } from '@asterflow/request'
// const request = createExpressRequest(req)
```

## 🔗 Related Packages

- [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) - supplies the `Runtime` enum this package's types key off of, and calls this package's `create*Request` factories to build requests for each runtime
- [asterflow](https://www.npmjs.com/package/asterflow) - core framework, uses `Request` as the request type passed into handlers
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - imports `Request`/`AsterRequest` as the request type for route and middleware handlers
- [@asterflow/multipart](https://www.npmjs.com/package/@asterflow/multipart) - extends `AsterRequest` via `.extend()` to attach parsed multipart form data

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
