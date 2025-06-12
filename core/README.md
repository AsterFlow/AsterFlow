<div align="center">

# @asterflow/core

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=b4befe)
![commit-activity](https://img.shields.io/github/commit-activity/y/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af)
![code-size](https://img.shields.io/github/languages/code-size/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)

![top-language](https://img.shields.io/github/languages/top/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)
![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/core?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> The heart of the AsterFlow framework, providing server initialization and configuration with strong typing.

## 📦 Installation

```bash
npm install @asterflow/core
# or
bun install @asterflow/core
```

## 💡 About

@asterflow/core is the central package of the AsterFlow framework. It provides server initialization, integration with different HTTP adapters, and a typed routing system. The package brings together all other AsterFlow components into a cohesive framework.

## ✨ Features

- **HTTP Adapters:** Native support for different HTTP servers (Node.js, Fastify, Express)
- **Routing System:** Typed routing with support for dynamic parameters
- **Middleware:** Flexible middleware system with typed context
- **Type Safety:** Full TypeScript support with type inference
- **High Performance:** Optimized routing system using prefix tree (trie)
- **URL Analysis:** Integrated URL parser with support for dynamic parameters

## 🚀 Usage

### Basic Setup

```typescript
import { AsterFlow } from '@asterflow/core'
import { adapters } from '@asterflow/adapter'
import fastify from 'fastify'

const server = fastify()
const aster = new AsterFlow({ 
  driver: adapters.fastify 
})

aster.listen(server, { port: 3000 })
```

### Defining Routes

```typescript
import { Router } from '@asterflow/router'

const router = new Router({
  path: '/:id=number?query#fragment',
  methods: {
    get({ response, url }) {
      const params = url.getParams() // params.id is typed as number
      const query = url.getSearchParams()
      return response.send('Hello World')
    }
  }
})

aster.controller(router)
```

### Using Middleware

```typescript
import { Middleware, Router } from '@asterflow/router'

const auth = new Middleware({
  name: 'auth',
  onRun({ next }) {
    return next({
      auth: false
    })
  }
})

const router = new Router({
  path: '/protected',
  use: [auth],
  methods: {
    get({ response, middleware }) {
      if (!middleware.auth) {
        return response.unauthorized({ 
          message: 'Unauthorized' 
        })
      }
      return response.send('Protected area')
    }
  }
})
```

### Individual Routes

```typescript
import { Method } from '@asterflow/router'

const route = new Method({
  path: '/users/:id=number',
  method: 'get',
  handler: ({ response, url }) => {
    const { id } = url.getParams() // id is typed as number
    return response.send({ id })
  }
})

aster.controller(route)
```

## 🔗 Related Packages

- [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) - HTTP adapters for different runtimes
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - Type-safe routing system
- [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - Unified HTTP request system
- [@asterflow/response](https://www.npmjs.com/package/@asterflow/response) - Type-safe HTTP response system
- [reminist](https://www.npmjs.com/package/reminist) - Blazing fast, zero-dependency, TypeScript-native router
- [url-ast](https://www.npmjs.com/package/url-ast) - High-performance typed URL parser with automatic type casting
- [@asterflow/plugin](https://www.npmjs.com/package/@asterflow/plugin) - A modular and typed plugin system

## 📄 License

MIT - See [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.
