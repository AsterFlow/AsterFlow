<div align="center">

# @asterflow/core

![license-info](https://img.shields.io/github/license/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/Ashu11-A/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![last-commit](https://img.shields.io/github/last-commit/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=b4befe)
![commit-activity](https://img.shields.io/github/commit-activity/y/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af)
![code-size](https://img.shields.io/github/languages/code-size/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)

![top-language](https://img.shields.io/github/languages/top/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)
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

## 📚 API Reference

### AsterFlow Class

#### Constructor Options

```typescript
interface AsterFlowOptions<Drive extends Adapter<Runtime>> {
  driver?: Drive
}
```

#### Methods

- `listen(server, options)`: Starts the HTTP server
- `router({ basePath, controllers })`: Registers multiple routes with a base path
- `controller(router)`: Registers an individual route
- `setup()`: Configures the request handler

## 🔗 Related Packages

- [@asterflow/adapter](https://github.com/Ashu11-A/AsterFlow/tree/main/packages/adapter) - HTTP adapters for different runtimes
- [@asterflow/router](https://github.com/Ashu11-A/AsterFlow/tree/main/packages/router) - Typed routing system
- [@asterflow/request](https://github.com/Ashu11-A/AsterFlow/tree/main/packages/request) - Unified HTTP request system

## 📄 License

MIT - See [LICENSE](https://github.com/Ashu11-A/AsterFlow/blob/main/LICENSE) for more details.
