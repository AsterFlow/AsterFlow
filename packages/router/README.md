# @asterflow/router

Type-safe and flexible routing system for AsterFlow applications.

![npm version](https://img.shields.io/npm/v/@asterflow/router?style=flat-square)
![license](https://img.shields.io/npm/l/@asterflow/router?style=flat-square)

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

## 📚 API Reference

### Router Class

```typescript
class Router<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  Middlewares extends readonly Middleware[]
> {
  constructor(options: {
    path: Path
    name?: string
    description?: string
    use?: Middlewares
    schema?: Schema
    methods: {
      [M in MethodKeys]?: RouteHandler
    }
  })
}
```

### Method Class

```typescript
class Method<
  Responder extends Responders,
  Path extends string,
  Method extends MethodKeys,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware[]
> {
  constructor(options: {
    path: Path
    method: Method
    name?: string
    schema?: Schema
    use?: Middlewares
    handler: MethodHandler
  })
}
```

### Response Class

```typescript
class Response<Responder extends Responders> {
  // Status Methods
  success(data: Responder[200]): Response
  created(data: Responder[201]): Response
  noContent(data: Responder[204]): Response
  badRequest(data: Responder[400]): Response
  unauthorized(data: Responder[401]): Response
  forbidden(data: Responder[403]): Response
  notFound(data: Responder[404]): Response

  // Headers and Cookies
  setHeader(name: string, value: string): Response
  setCookie(name: string, value: string): Response

  // Conversion
  toResponse(): globalThis.Response
  toServerResponse(output: ServerResponse): void
}
```

### Middleware Class

```typescript
class Middleware<
  Responder extends Responders,
  Schema extends AnySchema,
  Name extends string,
  Parameters extends Record<string, unknown>
> {
  constructor(options: {
    name: Name
    onRun: (args: {
      request: Request
      response: Response<Responder>
      schema: InferSchema<Schema>
      next: (params: Parameters) => MiddlewareOptions
    }) => MiddlewareOptions
  })
}
```

## 🔗 Related Packages

- [@asterflow/core](../../core/README.md) - Core framework
- [@asterflow/url-parser](../url-parser/README.md) - URL parsing utilities
- [@asterflow/adapter](../adapter/README.md) - Adapters for different HTTP servers

## 📄 License

MIT - See [LICENSE](../../LICENSE) for more details.
