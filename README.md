<div align="center">

# AsterFlow

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=b4befe)
![commit-activity](https://img.shields.io/github/commit-activity/y/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af)
![code-size](https://img.shields.io/github/languages/code-size/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)

![top-language](https://img.shields.io/github/languages/top/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)
![bundle-size](https://img.shields.io/bundlejs/size/asterflow?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> AsterFlow is a modular, strongly typed framework for building HTTP APIs in TypeScript. It runs on Node, Bun, Express or Fastify through a shared adapter layer, and keeps routes, middleware, schemas and plugins fully typed end to end.

## 📦 Installation

```bash
bunx @asterflow/cli init my-app
```

This scaffolds a project: picks an adapter (Bun, Node, Express or Fastify), optional plugins (file-based routing, multipart uploads), and installs everything for you. See [`@asterflow/cli`'s README](packages/cli/README.md) for flags and the other commands (`add`, `list`, `generate`).

### ✨ Features

- **Full type inference** - every route registered narrows the app's type, so path params, schema and middleware context are known at every call site, no code generation needed.
- **Multi-runtime** - the same app runs on Node's `http`, `Bun.serve`, Express or Fastify; swap the driver, keep the routes.
- **Typed middleware chain** - a route's `use` middlewares run before schema validation and can short-circuit with a response at any point.
- **Native schema validation** - Zod or `@caeljs/config` schemas validate the request body and infer its type straight into the handler.
- **Plugin system** - `.use(plugin, config)` extends the instance and taps into `beforeInitialize`/`afterInitialize`/`onRequest`/`onResponse` hooks.
- **Trie-based routing** - routes are matched with `reminist`, keyed by HTTP method, with typed dynamic and catch-all params.
- **Type-safe responses** - status-coded helpers (`success`, `created`, `notFound`, ...) that narrow the expected body per status.

## ❓ How to Use

A minimal app with a validated route:

```ts
import { AsterFlow } from 'asterflow'
import { z } from 'zod'

const app = new AsterFlow() // defaults to the Node adapter

app.method('post', {
  path: '/users',
  schema: z.object({ name: z.string() }),
  handler({ schema, response }) {
    return response.created({ name: schema.name })
  }
})

app.listen({ port: 3000 })
```

Swap the runtime and add a plugin without touching the routes:

```ts
import { AsterFlow } from 'asterflow'
import { adapters } from '@asterflow/adapter'
import { fsRoutingPlugin } from '@asterflow/fs'
import routes from './routes.gen'

const app = new AsterFlow({ driver: adapters.bun })
  .use(fsRoutingPlugin, { routes })

app.listen({ port: 3000 })
```

## 📦 Packages

| Package | Description |
| --- | --- |
| [`asterflow`](core/README.md) | The core framework - ties adapters, routing, plugins and responses into one typed app |
| [`@asterflow/adapter`](packages/adapter/README.md) | Wires a runtime's native server (Bun, Node, Express, Fastify) into AsterFlow |
| [`@asterflow/router`](packages/router/README.md) | Typed route and middleware definitions (`Method`, `Router`, `Middleware`) |
| [`@asterflow/request`](packages/request/README.md) | Wraps each runtime's native request into one typed `AsterRequest` |
| [`@asterflow/response`](packages/response/README.md) | Type-safe HTTP response builder with status-code helpers |
| [`@asterflow/plugin`](packages/plugin/README.md) | Typed builder for writing AsterFlow plugins |
| [`@asterflow/cli`](packages/cli/README.md) | Scaffolds projects, adds plugins, generates the fs-routing manifest |
| [`@asterflow/fs`](plugins/fs/README.md) | File-based routing - generates a static route manifest from a `routes/` directory |
| [`@asterflow/multipart`](plugins/multipart/README.md) | Parses `multipart/form-data` requests with typed per-route field rules |

## 📄 License

MIT
