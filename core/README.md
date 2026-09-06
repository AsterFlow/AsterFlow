<div align="center">

# AsterFlow

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=core&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/asterflow?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> The core framework - ties together adapters, routing, plugins and responses into one typed `AsterFlow` app.

## 📦 Installation

```bash
bun install asterflow
```

### ✨ Features

- **`new AsterFlow(options)`** - creates an app around a `driver` (an `@asterflow/adapter` instance, defaults to `adapters.node`)
- **`.method(...)` / `.router(...)`** - define a single-verb route or a multi-verb route group directly on the app, backed by `@asterflow/router`'s `Method`/`Router`
- **`.controller(route)`** - registers an already-built `Method` or `Router` instance
- **`.middleware({ basePath, controllers })`** - registers a group of controllers under a shared path prefix
- **Route `use` middlewares run first** - a route's middleware chain runs before schema validation, and any middleware can return a response to short-circuit the request before the body is even parsed
- **Schema validation** - if the route has a schema, the parsed body is validated after middlewares pass and before the handler runs
- **Plugin system** - `.use(plugin, config)` registers an `@asterflow/plugin` instance, applies its instance extensions, and wires up its `beforeInitialize`/`afterInitialize`/`onRequest`/`onResponse` hooks
- **Merged plugin context** - every plugin's context is resolved once, when `.listen()` is called, and handed to every handler as `context.plugins` (not recomputed per request)
- **Trie-based route matching** - routes are stored and matched with `reminist`, keyed by HTTP method
- **Full type inference** - registering a route narrows the app's type so its path, params, schema and middleware context are known at every call site

## ❓ How to Use

Build routes with `.method()`/`.router()` and start the server with `.listen()`. This route validates its body with a middleware-provided context before running:

```ts
import { AsterFlow } from 'asterflow'
import { Middleware } from '@asterflow/router'
import { z } from 'zod'

const auth = new Middleware({
  name: 'auth',
  onRun({ request, response, next }) {
    if (!request.getHeaders().authorization) return response.unauthorized({ message: 'Missing token' })
    return next({ userId: 42 })
  }
})

const app = new AsterFlow() // defaults to the Node adapter

app.method('post', {
  path: '/users',
  use: [auth],
  schema: z.object({ name: z.string() }),
  handler({ schema, middleware, response }) {
    return response.created({ id: middleware.userId, name: schema.name })
  }
})

app.listen({ port: 3000 })
```

Plugins register onto the same instance with `.use()` and can add their own instance methods:

```ts
import { AsterFlow } from 'asterflow'
import { fsRoutingPlugin } from '@asterflow/fs'

const app = new AsterFlow()
  .use(fsRoutingPlugin, { routes: [] }) // routes: AnyRouter[]

app.listen({ port: 3000 })
```

## 🔗 Related Packages

- [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) - supplies the `driver` (Bun, Node, Express, Fastify) that `.listen()` delegates to
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - `Method`/`Router`/`Middleware` classes that back `.method()`, `.router()` and `.controller()`
- [@asterflow/plugin](https://www.npmjs.com/package/@asterflow/plugin) - plugin instances and types consumed by `.use()`
- [@asterflow/response](https://www.npmjs.com/package/@asterflow/response) - `AsterResponse` is what every request handler works with and returns
- [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - supplies the `Request` type passed into every route and middleware handler

## 📄 License

This project is licensed under the [MIT License](../LICENSE).
