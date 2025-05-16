# @asterflow/reminist

High-performance routing system for AsterFlow.

![npm version](https://img.shields.io/npm/v/@asterflow/reminist?style=flat-square)
![license](https://img.shields.io/npm/l/@asterflow/reminist?style=flat-square)

## 📦 Installation

```bash
npm install @asterflow/reminist
# or
bun install @asterflow/reminist
```

## 💡 About

@asterflow/reminist is an optimized routing system designed for AsterFlow applications. It provides an efficient way to manage HTTP routes using a prefix tree (trie) structure, enabling fast route matching and support for dynamic parameters.

## ✨ Features

- **High Performance:** Optimized for fast route matching using prefix tree
- **Type Safety:** Full TypeScript support with type inference
- **Dynamic Parameters:** Support for routes with parameters (e.g., `/users/:id`)
- **Tree Structure:** Efficient hierarchical organization of routes
- **AsterFlow Integration:** Designed to work seamlessly with the AsterFlow framework
- **HTTP Method Management:** Support for different HTTP methods per route

## 🚀 Usage

### Basic Usage

```typescript
import { Reminist } from '@asterflow/reminist'

// Create a router instance
const router = Reminist.create<RouterType>()({
  keys: ['get', 'post', 'put', 'delete']
})

// Add a route
router.add('get', '/users', userHandler)

// Find a route
const route = router.find('get', '/users')
```

### AsterFlow Integration

```typescript
import { AsterFlow } from '@asterflow/core'
import { Router, Method } from '@asterflow/router'

const app = new AsterFlow()

// Create a router
const userRouter = new Router({
  path: '/users',
  methods: {
    get: async ({ response }) => {
      return response.ok({ message: 'User list' })
    }
  }
})

// Add to AsterFlow
app.router({
  basePath: '/api',
  controllers: [userRouter]
})
```

### Routes with Parameters

```typescript
import { Router } from '@asterflow/router'

const userRouter = new Router({
  path: '/users/:id',
  methods: {
    get: async ({ request, response }) => {
      const userId = request.params.id
      return response.ok({ userId })
    }
  }
})
```

## 📚 API Reference

### Reminist Class

```typescript
class Reminist<Data, Keys extends readonly string[]> {
  add(key: Keys[number], path: string, store: Data): void
  find(key: Keys[number], path: string): Node<Data> | null
  delete(key: Keys[number], path: string): boolean
  has(key: Keys[number], path: string): boolean
}
```

### Node Class

```typescript
class Node<Data, Path extends string, Nodes extends readonly Node<any>[], Endpoint extends boolean> {
  name: Path
  store?: Data
  endpoint: Endpoint
  inert: Map<number, Node<Data>>
}
```

## 🔗 Related Packages

- [@asterflow/core](../../core/README.md) - Core framework
- [@asterflow/router](../router/README.md) - Router definitions

## 📄 License

MIT - See [LICENSE](../../LICENSE) for more details.
