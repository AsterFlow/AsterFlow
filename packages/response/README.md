<div align="center">

# @asterflow/response

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=b4befe)
![commit-activity](https://img.shields.io/github/commit-activity/y/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af)
![code-size](https://img.shields.io/github/languages/code-size/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)

![top-language](https://img.shields.io/github/languages/top/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=90dceb)
![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/response?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Unified HTTP response adapter system for AsterFlow applications.

## 📦 Installation

```bash
npm install @asterflow/response
# or
bun install @asterflow/response
```

## 💡 About

@asterflow/response provides a type-safe, unified response system for AsterFlow applications. It standardizes HTTP response handling across different runtimes while maintaining full type safety and providing convenient helper methods for common HTTP status codes.

## ✨ Features

- **Complete Type Safety:** Full TypeScript support with type inference for responses, status codes, and body types
- **Status Code Helpers:** Built-in methods for common HTTP status codes (200, 201, 400, 404, etc.)
- **Header Management:** Type-safe header manipulation with method chaining
- **Cookie Support:** Integrated cookie management system
- **Content Type Detection:** Automatic content type detection and JSON serialization
- **Multi-Runtime Support:** Compatible with standard Response and Node.js ServerResponse
- **Immutable Design:** Response objects are immutable, promoting safer code patterns
- **Method Chaining:** Fluent API for building complex responses

## 🚀 Usage

### Basic Response

```typescript
import { Response } from '@asterflow/response'

// Simple text response
const response = new Response()
  .success({ message: 'Hello World!' })

// With status code
const response = new Response()
  .status(201)
  .send({ id: 1, name: 'User' })
```

### Status Code Helpers

```typescript
import { Response } from '@asterflow/response'

// Success responses
const success = new Response().success({ data: 'Success!' })
const created = new Response().created({ id: 1 })
const noContent = new Response().noContent()

// Error responses
const badRequest = new Response().badRequest({ error: 'Invalid input' })
const unauthorized = new Response().unauthorized({ error: 'Not authenticated' })
const forbidden = new Response().forbidden({ error: 'Access denied' })
const notFound = new Response().notFound({ error: 'Resource not found' })
const zodError = new Response().zodError({ errors: ['Validation failed'] })
```

### Headers and Cookies

```typescript
import { Response } from '@asterflow/response'

const response = new Response()
  .success({ message: 'Hello!' })
  .setHeader('X-Custom-Header', 'custom-value')
  .setHeader('Cache-Control', 'no-cache')
  .setCookie('session', 'abc123')
  .setCookie('theme', 'dark')

// Headers and cookies are fully typed
console.log(response.header) // Map with typed entries
console.log(response.cookies) // Map with typed entries
```

### JSON Responses

```typescript
import { Response } from '@asterflow/response'

// Automatic JSON serialization
const jsonResponse = new Response()
  .json({ 
    users: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
  })

// Content-Type automatically set to application/json
```

### Integration with Different Runtimes

#### Standard Web API

```typescript
import { Response } from '@asterflow/response'

const response = new Response()
  .success({ message: 'Hello World!' })

// Convert to standard Response
const webResponse = response.toResponse()
```

#### Node.js HTTP Server

```typescript
import { Response } from '@asterflow/response'
import { createServer } from 'http'

createServer((req, res) => {
  const response = new Response()
    .success({ message: 'Hello from Node.js!' })
  
  // Convert to ServerResponse
  response.toServerResponse(res)
})
```

### Advanced Type Safety

```typescript
import { Response } from '@asterflow/response'

// Define custom response types
type MyResponders = {
  200: { message: string; data: unknown }
  201: { id: number; message: string }
  400: { error: string; details?: string[] }
  404: { error: string }
}

const response = new Response<MyResponders>()
  .success({ message: 'Success!', data: { id: 1 } }) // Fully typed
  
// TypeScript will enforce the correct shape for each status code
```

### Method Chaining

```typescript
import { Response } from '@asterflow/response'

const response = new Response()
  .status(201)
  .setHeader('Location', '/users/123')
  .setHeader('X-Request-ID', 'req-123')
  .setCookie('last-action', 'create-user')
  .json({ 
    id: 123, 
    message: 'User created successfully' 
  })
```

## 🔧 API Reference

### Core Methods

- `status(code)` - Set HTTP status code
- `getStatus()` - Get current status code
- `send(data)` - Send response with data
- `json(data)` - Send JSON response with proper Content-Type

### Status Code Helpers

- `success(data)` - 200 OK
- `created(data)` - 201 Created
- `noContent(data)` - 204 No Content
- `badRequest(data)` - 400 Bad Request
- `unauthorized(data)` - 401 Unauthorized
- `forbidden(data)` - 403 Forbidden
- `notFound(data)` - 404 Not Found
- `zodError(data)` - 422 Unprocessable Entity

### Header and Cookie Management

- `setHeader(name, value)` - Add/update header
- `setCookie(name, value)` - Add/update cookie

### Runtime Conversion

- `toResponse()` - Convert to standard Web API Response
- `toServerResponse(serverRes)` - Write to Node.js ServerResponse

## 🔗 Related Packages

- [@asterflow/core](https://www.npmjs.com/package/@asterflow/core) - Core framework
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - Type-safe routing system
- [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) - HTTP adapters for different runtimes
- [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - Unified HTTP request system

## 📄 License

MIT - See [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.
