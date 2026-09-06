<div align="center">

# @asterflow/router

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=packages%2Frouter&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/router?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Typed route and middleware definitions (`Method`, `Router`, `Middleware`) for AsterFlow applications.

## 📦 Installation

```bash
bun install @asterflow/router
```

### ✨ Features

- **`Method`** - defines a single route bound to one HTTP verb, passed as the first argument (`new Method('post', {...})` or `Method.POST`). `Method.create(method)` defers the handler so plugins can chain in request extensions (e.g. `.multipart({...})`) before the terminal `.handler(fn)` call.
- **`Router`** - groups handlers for several HTTP verbs under one path. `Router.builder()` gives an extensible, per-method builder (`.method('post', b => ...)`) so each verb can carry its own request extensions independently.
- **`Middleware`** - typed middleware chain. `onRun` either calls `next(params)` to continue (merging `params` into the typed `middleware` context) or returns an `AsterResponse` to short-circuit the chain.
- **Schema validation** - route schemas accept a Zod schema or a `@caeljs/tsh` shape; the parsed result is inferred straight into the handler's `schema` argument.
- **Extension registry** - a `WeakMap`-based store (`extensionRegistry.ts`) that plugins use to attach per-router, per-method data, read back at request time.

## ❓ How to Use

For a normal route, use `new Method(method, options)` - the HTTP method comes first, either as a plain string or as one of `Method`'s own constants (`Method.GET`, `Method.POST`, ...) - and validate the body with Zod:

```ts
import { Method } from '@asterflow/router'
import { z } from 'zod'

export default new Method(Method.POST, {
  path: '/users',
  schema: z.object({ name: z.string(), email: z.string().email() }),
  handler({ schema, response }) {
    return response.created({ user: schema })
  }
})
```

Only reach for `Method.create(method, options?)` when you need a plugin's fully-typed extension - like multipart's `.multipart(schema)` - chained in before the handler. `create()` defers the handler so the extension can widen the request type first, and `options` is optional:

```ts
import { Method } from '@asterflow/router'

export default Method.create(Method.POST)
  .multipart({
    avatar: { mimeTypes: ['image/png', 'image/jpeg'], maxSize: 5 * 1024 * 1024, required: true }
  })
  .handler(({ request, response }) => {
    const avatar = request.getFile('avatar')
    return response.success({ filename: avatar.filename })
  })
```

Both examples use `export default`: it's what `app.controller(route)` expects when you register a route by hand, and it's the export `@asterflow/fs`'s file-based routing looks for in every route file.

## 🔗 Related Packages

- [asterflow](https://www.npmjs.com/package/asterflow) - core framework, depends on this package to register and run routes
- [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - request abstraction; this package imports its `Request`/`AsterRequest` types for route and middleware handlers
- [@asterflow/fs](https://www.npmjs.com/package/@asterflow/fs) - filesystem-based routing plugin, builds routes with `Method`/`Router`
- [@asterflow/multipart](https://www.npmjs.com/package/@asterflow/multipart) - multipart upload plugin, extends `Method` routes

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
