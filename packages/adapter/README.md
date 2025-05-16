# @asterflow/adapter

HTTP adapters for the AsterFlow framework, providing a unified interface for different runtimes.

![npm version](https://img.shields.io/npm/v/@asterflow/adapter?style=flat-square)
![license](https://img.shields.io/npm/l/@asterflow/adapter?style=flat-square)

## 📦 Installation

```bash
npm install @asterflow/adapter
# or
bun install @asterflow/adapter
```

## 💡 About

@asterflow/adapter is an HTTP adapter system that allows AsterFlow applications to run on different execution environments. The package provides an abstraction layer that unifies the interface of different HTTP servers, allowing you to write your code once and run it on any supported runtime.

## ✨ Features

- **Multiple Runtimes:** Native support for:
  - Node.js HTTP Server
  - Bun
  - Express
  - Fastify
- **Unified Interface:** Consistent API regardless of runtime
- **Error Handling:** Robust error handling system with standardized responses
- **Strong Typing:** Full TypeScript support with type inference
- **Router Integration:** Works seamlessly with AsterFlow's routing system
- **Zero Configuration:** Works immediately after installation
- **Middleware Support:** Compatible with runtime-specific middleware

## 🚀 Usage

### Basic Example

```typescript
import { AsterFlow } from '@asterflow/core'
import { adapters } from '@asterflow/adapter'
import { Router } from '@asterflow/router'

// Create an AsterFlow instance with the desired adapter
const app = new AsterFlow({ 
  driver: adapters.node // or adapters.bun, adapters.express, adapters.fastify
})

// Define your routes
const router = new Router({
  path: '/hello',
  methods: {
    get({ response }) {
      return response.send('Hello World!')
    }
  }
})

// Register routes
app.controller(router)

// Start the server
app.listen({ port: 3000 })
```

### Available Adapters

#### Node.js HTTP Server

```typescript
import { AsterFlow } from '@asterflow/core'
import { adapters } from '@asterflow/adapter'

const app = new AsterFlow({
  driver: adapters.node
})

app.listen({ port: 3000 })
```

#### Bun

```typescript
import { AsterFlow } from '@asterflow/core'
import { adapters } from '@asterflow/adapter'

const app = new AsterFlow({
  driver: adapters.bun
})

app.listen({ port: 3000 })
```

#### Express

```typescript
import { AsterFlow } from '@asterflow/core'
import { adapters } from '@asterflow/adapter'
import express from 'express'

const expressApp = express()
const app = new AsterFlow({
  driver: adapters.express
})

// Use Express middleware
expressApp.use(express.json())

app.listen(expressApp, 3000)
```

#### Fastify

```typescript
import { AsterFlow } from '@asterflow/core'
import { adapters } from '@asterflow/adapter'
import fastify from 'fastify'

const server = fastify()
const app = new AsterFlow({
  driver: adapters.fastify
})

app.listen(server, { port: 3000 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})
```

## 🔧 Architecture

### Adapter System

The package uses an adapter system that implements the `Adapter` interface:

```typescript
class Adapter<Type extends Runtime> {
  readonly runtime: Type
  readonly listen: OptionsDriver<Type>['listen']
  onRequest?: (request: Request, response: Response) => Promise<Response> | Response
}
```

Each adapter implements:
- Runtime-specific server initialization
- Request conversion to AsterFlow format
- Standardized error handling
- Integration with the routing system

### Error Handling

The system includes robust error handling that:
- Standardizes error responses
- Provides stack traces in development environment
- Logs errors for diagnostics
- Maintains security by not exposing sensitive details in production

```typescript
interface ErrorPayload {
  statusCode: number
  error: string
  message: string
  details?: unknown
}
```

## 📚 API Reference

### Main Types

```typescript
enum Runtime {
  Bun = 'bun',
  Express = 'express',
  Node = 'node',
  Fastify = 'fastify'
}

interface OptionsDriver<Type extends Runtime> {
  runtime: Type
  listen: (...params: ListenParams<Type>) => void
  onRequest?: (request: Request, response?: Response) => Response | Promise<Response>
}
```

### Configuration Options

Each adapter accepts runtime-specific options while maintaining proper typing:

```typescript
// Node/Bun
interface ListenOptions {
  port: number
  host?: string
  backlog?: number
}

// Fastify
interface FastifyOptions extends FastifyListenOptions {
  // Fastify-specific options
}

// Express
type ExpressOptions = Express.Application
```

## 🔗 Related Packages

- [@asterflow/core](../../core/README.md) - Core framework
- [@asterflow/router](../router/README.md) - Routing system
- [@asterflow/request](../request/README.md) - HTTP client

## 📄 License

MIT - See [LICENSE](../../LICENSE) for more details.
