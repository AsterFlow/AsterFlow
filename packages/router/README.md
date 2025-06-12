<div align="center">

# @asterflow/router

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=b4befe)
![commit-activity](https://img.shields.io/github/commit-activity/y/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af)
![code-size](https://img.shields.io/github/languages/code-size/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)

![top-language](https://img.shields.io/github/languages/top/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)
![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/request?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Type-safe and flexible routing system for AsterFlow applications.

## 📦 Installation

```bash
npm install @asterflow/router
# or
bun install @asterflow/router
```

## 💡 About

@asterflow/router is the routing foundation of AsterFlow. It provides a powerful, type-safe routing system with support for middleware, parameter validation, and flexible route organization.

## ✨ Features

- **Complete Type Safety:** Full TypeScript support with type inference for routes, parameters, and responses
- **Middleware System:** Support for middlewares with typed context and chaining
- **Parameter Validation:** Built-in support for Zod and @caeljs/tsh
- **URL Analysis:** Integrated URL parser with support for dynamic parameters, query strings, and fragments
- **Standardized Responses:** Typed response system with helpers for common HTTP codes
- **Flexible Organization:** Support for individual routes (Method) and grouped routes (Router)

## 🚀 Usage

### Basic Router Route

```typescript
import { Router } from '@asterflow/router'

const router = new Router({
  path: '/hello/:name',
  methods: {
    get({ response, url }) {
      const params = url.getParams()
      return response.success({ 
        message: `Hello ${params.name}!` 
      })
    }
  }
})
```

### Using Middlewares

```typescript
import { Middleware, Router } from '@asterflow/router'

const authMiddleware = new Middleware({
  name: 'auth',
  onRun({ next }) {
    return next({
      isAuthenticated: true,
      user: { id: 1 }
    })
  }
})

const router = new Router({
  path: '/protected',
  use: [authMiddleware],
  methods: {
    get({ response, middleware }) {
      if (!middleware.isAuthenticated) {
        return response.unauthorized({ message: 'Not authenticated' })
      }
      return response.success({ user: middleware.user })
    }
  }
})
```

### Validation with Zod

```typescript
import { Method } from '@asterflow/router'
import { z } from 'zod'

const createUser = new Method({
  path: '/users',
  method: 'post',
  schema: z.object({
    name: z.string(),
    email: z.string().email()
  }),
  handler: ({ schema, response }) => {
    return response.created({
      user: {
        name: schema.name,
        email: schema.email
      }
    })
  }
})
```

### URL Parameters

```typescript
import { Router } from '@asterflow/router'

const router = new Router({
  // Supports dynamic parameters (:id), 
  // query strings (?page) and 
  // fragments (#section)
  path: '/users/:id=number?page#section',
  methods: {
    get({ url, response }) {
      console.log(url.getParams())      // { id: number }
      console.log(url.getSearchParams()) // { page: string }
      console.log(url.getFragment())     // 'section'
      return response.success({ /* ... */ })
    }
  }
})
```

### Integrating with Fastify

```typescript
import { adapters } from '@asterflow/adapter'
import { AsterFlow } from '@asterflow/core'
import fastify from 'fastify'

const server = fastify()
const app = new AsterFlow({ 
  driver: adapters.fastify 
})

// Add routes
app.controller(router)

// Start the server
app.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})
```

## 🔗 Related Packages

- [@asterflow/core](https://www.npmjs.com/package/@asterflow/core) - Core framework
- [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) - Adapters for different HTTP servers
- [@asterflow/response](https://www.npmjs.com/package/@asterflow/response) - Type-safe HTTP response system
- [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - Unified HTTP request system
- [@asterflow/plugin](https://www.npmjs.com/package/@asterflow/plugin) - A modular and typed plugin system

## 📄 License

MIT - See [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.
