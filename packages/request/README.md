# @asterflow/request

Unified HTTP request adapter system for AsterFlow.

![npm version](https://img.shields.io/npm/v/@asterflow/request?style=flat-square)
![license](https://img.shields.io/npm/l/@asterflow/request?style=flat-square)

## 📦 Installation

```bash
npm install @asterflow/request
# or
bun install @asterflow/request
```

## 💡 About

@asterflow/request is an adapter system that provides a unified interface for handling HTTP requests across different runtimes (Bun, Express, Fastify, and Node.js) in the AsterFlow ecosystem. It standardizes access to request properties and methods, regardless of the runtime being used.

## ✨ Features

- **Multiple Adapters:** Support for Bun, Express, Fastify, and Node.js
- **Unified Interface:** Consistent API for request handling
- **Type Safety:** Full TypeScript support
- **AsterFlow Integration:** Designed to work seamlessly with the AsterFlow framework
- **Body Handling:** Support for different request body types
- **Headers Management:** Unified interface for header manipulation

## 🚀 Usage

### Express Adapter

```typescript
import { ExpressRequest } from '@asterflow/request'
import express from 'express'

const app = express()

app.use(async (req, res) => {
  const request = new ExpressRequest(req)
  
  // Unified access to request properties
  const body = await request.getBody()
  const headers = request.getHeaders()
  const method = request.getMethod()
  const pathname = request.getPathname()
})
```

### Bun Adapter

```typescript
import { BunRequest } from '@asterflow/request'

Bun.serve({
  async fetch(req) {
    const request = new BunRequest(req)
    
    // Same interface as other adapters
    const body = await request.getBody()
    const headers = request.getHeaders()
    const method = request.getMethod()
    const pathname = request.getPathname()
  }
})
```

### Fastify Adapter

```typescript
import { FastifyRequest } from '@asterflow/request'
import Fastify from 'fastify'

const app = Fastify()

app.all('*', async (req) => {
  const request = new FastifyRequest(req)
  
  // Consistent interface
  const body = await request.getBody()
  const headers = request.getHeaders()
  const method = request.getMethod()
  const pathname = request.getPathname()
})
```

### Node.js Adapter

```typescript
import { NodeRequest } from '@asterflow/request'
import { createServer } from 'http'

createServer(async (req, res) => {
  const request = new NodeRequest(req)
  
  // Same methods across all adapters
  const body = await request.getBody()
  const headers = request.getHeaders()
  const method = request.getMethod()
  const pathname = request.getPathname()
})
```

## 📚 API Reference

### Base Request Class

```typescript
abstract class Request<RequestType> {
  // Properties
  request: RequestType
  url: Analyze<string>

  // Abstract Methods
  abstract getBody(): Promise<unknown> | unknown
  abstract getHeaders(): Record<string, string>
  abstract getMethod(): string
  abstract getPathname(): string
}
```

### Available Adapters

- **ExpressRequest:** Adapter for Express.js
- **BunRequest:** Adapter for Bun
- **FastifyRequest:** Adapter for Fastify
- **NodeRequest:** Adapter for Node.js HTTP

### Common Methods

| Method | Return | Description |
|--------|---------|-----------|
| `getBody()` | `Promise<unknown> \| unknown` | Gets the request body |
| `getHeaders()` | `Record<string, string>` | Gets the request headers |
| `getMethod()` | `string` | Gets the HTTP method |
| `getPathname()` | `string` | Gets the URL path |

## 🔗 Related Packages

- [@asterflow/core](../../core/README.md) - Core framework
- [@asterflow/router](../router/README.md) - Routing system
- [@asterflow/url-parser](../url-parser/README.md) - URL Parser

## 📄 License

MIT - See [LICENSE](../../LICENSE) for more details.
