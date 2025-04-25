<div align="center">

# AsterFlow

![license-info](https://img.shields.io/github/license/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/Ashu11-A/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![last-commit](https://img.shields.io/github/last-commit/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=b4befe)
![commit-activity](https://img.shields.io/github/commit-activity/y/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af)
![code-size](https://img.shields.io/github/languages/code-size/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)

![top-language](https://img.shields.io/github/languages/top/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)
![bundle-size](https://img.shields.io/bundlejs/size/AsterFlow?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

## 💡 About

AsterFlow is a **modular**, **strongly typed** framework for building HTTP APIs in TypeScript.

### 📜 History

AsterFlow is a clean rewrite of [base-fastify](https://github.com/Ashu11-A/base-fastify), a project I originally created to improve my own workflow. It evolved substantially as I developed it. The name combines my nickname “Ashu” + “Router” + “Flow” (inspired by TensorFlow). I built it out of frustration with the unnecessary complexity of other frameworks—often you end up writing dozens of type definition files instead of focusing on the routes themselves, with needless modularization that only adds cognitive overhead. AsterFlow simplifies that process, and I hope it makes your life easier too!

I also toyed with a pseudo-framework called [Kython](https://github.com/Ashu11-A/Kython), which I developed alongside [Drylian](https://github.com/drylian) as an experiment to see who could go further without using AI.

### ✨ Features

- **Dynamic, Contextual Typing:** Every route added to the router automatically enriches its type context—no external file generation required.
- **Parameter Validation:** Natively support Zod or @caeljs/config for per-route schema validation.
- **Multi-Server Compatibility:** Abstractions for Node.js, Bun, Express, and Fastify.
- **tRPC-Inspired API:** Consume routes in a fully type-safe manner without auxiliary files.
- **Standardized Response Handling:** Dynamically configure status codes and response formats.
- **Package-Based Architecture:** Core, Driver, and Router modules are decoupled for maximum scalability.

## 📦 Packages

| Package               | Description                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| `@asterflow/driver` | HTTP server implementations and runtime abstractions.                             |
| `@asterflow/router` | Route definitions, methods, and standardized request/response handling.           |
| `@asterflow/core`   | Integrates Driver and Router, exposing the primary API for server initialization. |

## Installation

```bash
# You can use any package manager—npm, pnpm, bun, etc.
npm install @asterflow/driver @asterflow/router @asterflow/core
```

## ❓ How to Use

You can define two types of routes: **Method** or **Router**. A Router lets you group multiple HTTP methods (GET, POST, etc.) under a single base path.

<details>
  <summary>🎯 Method</summary>

```ts
// server/routers/index.get.ts
import { Method } from '@asterflow/router'

export default new Method({
  path: '/',
  method: 'get',
  handler: ({ response }) => {
    return response.status(200).send('hello world')
  }
})
```

</details>

<details>
  <summary>🖧 Router</summary>

```ts
// server/routers/example.ts
import { Router } from '@asterflow/router'

new Router({
  path: '/example',
  methods: {
    get({ response }) {
      return response.success('hello')
    },
    post({ response }) {
      return response.success('world')
    }
  }
})
```

</details>

### ✅ Validation

<details>
  <summary>Using CaelJS</summary>

```ts
import { c } from '@caeljs/config'

export default new Method({
  path: '/',
  method: 'post',
  schema: c.object({
    name: c.string()
  }),
  handler: ({ response, schema }) => {
    return response.status(200).send(`hello ${schema.name}`)
  }
})
```

</details>

<details>
  <summary>Using Zod</summary>

```ts
import { z } from 'zod'

export default new Method({
  path: '/',
  method: 'post',
  schema: z.object({
    name: z.string()
  }),
  handler: ({ response, schema }) => {
    return response.status(200).send(`hello ${schema.name}`)
  }
})
```

</details>

### 📡 Registering Routes

There are two ways of registering a route, the “controller”, where you only register one route, and the “router” where you can register multiple routes at once

<details>
  <summary>Controller</summary>

```ts
import { AsterFlow } from '@asterflow/core'
import method from '../routers/index.get'
import router from '../routers/example'

const aster = new AsterFlow(/* configuration detailed below */)
  .controller(router)
```

</details>

<details>
  <summary>Router</summary>

```ts
import { AsterFlow } from '@asterflow/core'
import method from '../routers/index.get'
import router from '../routers/example'

const aster = new AsterFlow(/* configuration detailed below */)
  .router({
    basePath: '/v1',
    controllers: [method]
  })
```

</details>

### 🏁 Starting the Server

AsterFlow supports Node.js, Bun, Express, and Fastify via the **@asterflow/driver** module. You may also implement your own driver, though that’s beyond this guide.

<details>
  <summary>Bun</summary>

> Requires Bun as the runtime.

```ts
import { AsterFlow } from '@asterflow/core'
import { drivers } from '@asterflow/driver'

const aster = new AsterFlow({ driver: drivers.bun })

/* Register routes */

aster.listen({ port: 3333 })
```

</details>

<details>
  <summary>Node.js (native HTTP)</summary>

```ts
import { AsterFlow } from '@asterflow/core'
import { drivers } from '@asterflow/driver'
import express from 'express'

const aster = new AsterFlow({ driver: drivers.node })

/* Register routes */

aster.listen({ port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})
```

</details>

<details>
  <summary>Fastify</summary>

```ts
import { AsterFlow } from '@asterflow/core'
import { drivers } from '@asterflow/driver'
import fastify from 'fastify'

const server = fastify()
const aster = new AsterFlow({ driver: drivers.fastify })

/* Register routes */

aster.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})
```

</details>

<details>
  <summary>Express</summary>

```ts
import { AsterFlow } from '@asterflow/core'
import { drivers } from '@asterflow/driver'
import express from 'express'

const server = express()
const aster = new AsterFlow({ driver: drivers.express })

/* Register routes */

aster.listen(server, 3333, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})
```

</details>

## ⭐ Recommendations

If you’re exploring alternatives, you might also like:

- [ElysiaJS](https://elysiajs.com)
- [tRPC](https://trpc.io/)
