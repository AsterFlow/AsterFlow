<div align="center">

# @asterflow/request

![license-info](https://img.shields.io/github/license/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/Ashu11-A/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![last-commit](https://img.shields.io/github/last-commit/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=b4befe)
![commit-activity](https://img.shields.io/github/commit-activity/y/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af)
![code-size](https://img.shields.io/github/languages/code-size/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)

![top-language](https://img.shields.io/github/languages/top/Ashu11-A/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)
![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/request?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Unified HTTP request adapter system for AsterFlow.

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

## 🔗 Related Packages

- [@asterflow/core](https://www.npmjs.com/package/@asterflow/core) - Core framework
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - Type-safe routing system
- [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) - HTTP adapters for different runtimes
- [@asterflow/response](https://www.npmjs.com/package/@asterflow/response) - Type-safe HTTP response system

## 📄 License

MIT - See [LICENSE](https://github.com/Ashu11-A/AsterFlow/blob/main/LICENSE) for more details.
