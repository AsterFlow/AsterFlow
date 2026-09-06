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

## 💡 About

AsterFlow is a **modular**, **strongly typed** framework for building HTTP APIs in TypeScript.

### 📜 History

AsterFlow is a clean rewrite of [base-fastify](https://github.com/AsterFlow/base-fastify), a project I originally created to improve my own workflow. It evolved substantially as I developed it. The name combines my nickname "Ashu" + "Router" + "Flow" (inspired by TensorFlow). I built it out of frustration with the unnecessary complexity of other frameworks—often you end up writing dozens of type definition files instead of focusing on the routes themselves, with needless modularization that only adds cognitive overhead. AsterFlow simplifies that process, and I hope it makes your life easier too!

I also toyed with a pseudo-framework called [Kython](https://github.com/AsterFlow/Kython), which I developed alongside [Drylian](https://github.com/drylian) as an experiment to see who could go further without using AI.

### ✨ Features

- **Dynamic, Contextual Typing:** Every route added to the router automatically enriches its type context—no external file generation required.
- **Parameter Validation:** Natively support Zod or @caeljs/config for per-route schema validation.
- **Multi-Server Compatibility:** Abstractions for Node.js, Bun, Express, and Fastify.
- **tRPC-Inspired API:** Consume routes in a fully type-safe manner without auxiliary files.
- **Standardized Response Handling:** Type-safe response system with status helpers and unified format handling.
- **Package-Based Architecture:** Core, Driver, and Router modules are decoupled for maximum scalability.

## 📦 Packages

| Package | Description |
| --------------------- | --------------------------------------------------------------------------------- |
| `asterflow` | The heart of the framework, providing server initialization and configuration with strong typing |
| `@asterflow/adapter` | HTTP adapters for different runtimes (Node.js, Bun, Express, Fastify) |
| `@asterflow/request` | Unified HTTP request adapter system |
| `@asterflow/response` | Type-safe HTTP response system with status helpers and runtime compatibility |
| `@asterflow/router` | Type-safe routing system with middleware and validation support |
| `@asterflow/cli` | Scaffolding and plugin management CLI (`asterflow init`, `add`, `list`, `generate`) |

## Installation

AsterFlow is split across several `@asterflow/*` packages (adapter, router, response, plugins, ...) that need to be installed and wired together consistently, so `npm install asterflow` alone isn't enough - use the CLI to scaffold a project instead. It picks an adapter, optional plugins (file-system routing, multipart uploads), and installs the right dependencies for you:

```bash
npx @asterflow/cli init my-app
# or: bunx @asterflow/cli init my-app / pnpm dlx @asterflow/cli init my-app

cd my-app
npm run dev
```

Every prompt has a matching flag for non-interactive use (CI, scripts, agents):

```bash
npx @asterflow/cli init my-app --adapter bun --plugins fs --yes
```

See [`@asterflow/cli`'s README](packages/cli/README.md) for the full command reference (`init`, `add`, `list`, `generate`).

### ✨ Features

- **HTTP Adapters:** Native support for Node.js, Bun, Express and Fastify through the adapter system
- **High-Performance Routing:** Optimized routing system using prefix tree
- **Parameter Validation:** Native support for Zod and @caeljs/config
- **Advanced URL Analysis:** URL parser with AST support and automatic typing
- **Middleware System:** Full middleware support with typed context
- **Standardized Responses:** Type-safe response system with status helpers and runtime compatibility
- **Modular Architecture:** Decoupled packages for maximum scalability
- **Dynamic Typing:** Automatic type inference without external files
- **tRPC-Inspired API:** Fully type-safe route consumption

## ❓ How to Use

### 🚀 Basic Setup

```typescript
import { AsterFlow } from 'asterflow'
import { adapters } from '@asterflow/adapter'
import fastify from 'fastify'

const server = fastify()
const aster = new AsterFlow({ 
  driver: adapters.fastify 
})

aster.listen(server, { port: 3000 })
```

### 🎯 Basic Routes

<details>
  <summary>Simple Method</summary>

```ts
import { Method } from '@asterflow/router'

export default new Method({
  path: '/users/:id.number', // Support for typed parameters
  method: 'get',
  handler: ({ response, url }) => {
    const { id } = url.getParams() // id is automatically typed as number
    return response.success({ id })
  }
})
```
</details>

<details>
  <summary>Router with Middleware</summary>

```ts
import { Router, Middleware } from '@asterflow/router'

const authMiddleware = new Middleware({
  name: 'auth',
  onRun({ next }) {
    return next({
      user: { id: 1, name: 'John' }
    })
  }
})

export default new Router({
  path: '/protected',
  use: [authMiddleware],
  methods: {
    get({ response, middleware }) {
      return response.success({ user: middleware.user })
    }
  }
})
```
</details>

### 🔍 Advanced Validation

<details>
  <summary>Validation with Zod</summary>

```ts
import { Method } from '@asterflow/router'
import { z } from 'zod'

export default new Method({
  path: '/users',
  method: 'post',
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(18)
  }),
  handler: ({ response, schema }) => {
    return response.created({ user: schema }) // Automatically typed
  }
})
```
</details>

<details>
  <summary>Validation with CaelJS</summary>

```ts
import { Method } from '@asterflow/router'
import { c } from '@caeljs/config'

export default new Method({
  path: '/users',
  method: 'post',
  schema: c.object({
    name: c.string(),
    email: c.string(),
    age: c.number().min(18)
  }),
  handler: ({ response, schema }) => {
    return response.created({ user: schema })
  }
})
```
</details>

### 🌐 HTTP Adapters

<details>
  <summary>Express Example</summary>

```ts
import { AsterFlow } from 'asterflow'
import { adapters } from '@asterflow/adapter'
import express from 'express'

const app = express()
const aster = new AsterFlow({ 
  driver: adapters.express 
})

// Express middleware
app.use(express.json())

// AsterFlow routes
aster.router({
  basePath: '/api',
  controllers: [/* your routes */]
})

aster.listen(app, 3000)
```
</details>

<details>
  <summary>Node.js HTTP Example</summary>

```ts
import { AsterFlow } from 'asterflow'
import { adapters } from '@asterflow/adapter'
import { createServer } from 'http'

const server = createServer()
const aster = new AsterFlow({ 
  driver: adapters.node 
})

// AsterFlow routes
aster.router({
  basePath: '/api',
  controllers: [/* your routes */]
})

aster.listen(server, { port: 3000 })
```
</details>

<details>
  <summary>Bun Example</summary>

```ts
import { AsterFlow } from 'asterflow'
import { adapters } from '@asterflow/adapter'

const aster = new AsterFlow({ 
  driver: adapters.bun 
})

// AsterFlow routes
aster.router({
  basePath: '/api',
  controllers: [/* your routes */]
})

aster.listen(null, { port: 3000 })
```
</details>

## ⭐ Recommendations

If you're exploring alternatives, you might also like:

- [ElysiaJS](https://elysiajs.com) - Minimal web framework for Bun
- [tRPC](https://trpc.io/) - Type-safe RPC framework
- [Fastify](https://fastify.io/) - Fast and low overhead web framework
- [Express](https://expressjs.com/) - Minimal web framework for Node.js

## 📄 License

MIT - See [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.