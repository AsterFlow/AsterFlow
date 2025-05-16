# @asterflow/url-parser

High-performance typed URL parser for AsterFlow applications.

![npm version](https://img.shields.io/npm/v/@asterflow/url-parser?style=flat-square)
![license](https://img.shields.io/npm/l/@asterflow/url-parser?style=flat-square)

## 📦 Installation

```bash
npm install @asterflow/url-parser
# or
bun install @asterflow/url-parser
```

## 💡 About

@asterflow/url-parser is a specialized module for analyzing and manipulating URLs in web applications. Using an Abstract Syntax Tree (AST), it provides deep and structured URL analysis, allowing detailed understanding of each component. The parser transforms the URL into a node structure that represents each element (protocol, hostname, parameters, etc.), facilitating manipulation and validation with full TypeScript support.

## ✨ Features

- **AST (Abstract Syntax Tree):** Deep URL structure analysis through interconnected nodes
- **Structural Analysis:** Node system for precise URL parsing
- **Advanced Typing:** Automatic type inference for parameters and values
- **Pattern Support:** Analysis of route patterns with dynamic parameters
- **Type Validation:** Automatic type conversion and validation (string, number, boolean, array)
- **Colorization:** Colored visualization of URL structure for debugging
- **High Performance:** Optimized parser with efficient buffer handling
- **UTF-8 Decoding:** Robust support for special characters and encoded URLs

## 🚀 Usage

### Basic URL Analysis

```typescript
import { Analyze } from '@asterflow/url-parser'

// Analyze a simple URL
const analyzer = new Analyze('/users/:id=number?active=boolean')

// Get route parameters
console.log(analyzer.getParams()) // ['id']

// Get search parameters
console.log(analyzer.getSearchParams()) // Map { 'active' => 'boolean' }

// Get pathname
console.log(analyzer.getPathname()) // '/users/:id'
```

### Analysis with Types

```typescript
import { Analyze } from '@asterflow/url-parser'

// URL template with types
const template = new Analyze('/api/users/:id=number/posts/:postId=string?sort=boolean')

// Real URL for analysis
const url = new Analyze('/api/users/123/posts/abc?sort=true', template)

// Get typed parameters
console.log(url.getParams())
// { id: 123, postId: 'abc' }

// Get typed query params
console.log(url.getSearchParams())
// { sort: true }
```

### Router Integration

```typescript
import { Router } from '@asterflow/router'
import { Analyze } from '@asterflow/url-parser'

const router = new Router({
  path: '/users/:id=number/posts/:postId=string',
  methods: {
    get({ url }) {
      // url is an instance of Analyze
      const params = url.getParams()
      // params is typed as { id: number, postId: string }
      return response.success({ params })
    }
  }
})
```

### Structure Visualization

```typescript
import { Analyze } from '@asterflow/url-parser'

const analyzer = new Analyze('/users/:id=number?active=boolean#section')

// Display analysis table
console.log(analyzer.display())
/*
Id  Symbol  Expression  Type    Start  End
1   /       Slash      -       0      1
2   users   Path       -       1      6
3   /       Slash      -       6      7
4   :       Colon      -       7      8
5   id      Variable   -       8      10
6   =       Equal      -       10     11
7   number  Value      Number  11     17
8   ?       Query      -       17     18
9   active  Parameter  -       18     24
10  =       Equal      -       24     25
11  boolean Value      Boolean 25     32
12  #       Hash       -       32     33
13  section Fragment   -       33     40
*/
```

## 📚 API Reference

### Analyze Class

```typescript
class Analyze<Path extends string, TypedPath, Parser> {
  // Main methods
  getParams(): TypedPath['params']
  getSearchParams(): TypedPath['searchParams']
  getFragment(): TypedPath['fragment']
  getPathname(): string
  
  // Origin methods
  getProtocol(): string | undefined
  getHostname(): string | undefined
  getPort(): string | undefined
  
  // Debug methods
  display(): string
  
  // Internal methods
  getNode(idOrName: string | number): Node | undefined
  getNodeByType(type: AllValues, position?: number): Node | undefined
  getContent(node: Node): string
}
```

### Node Class

```typescript
class Node {
  id: number
  expression: AllValues
  start: number
  end: number
  type: ContentTypes | InternalExpression.Null
  
  setExpression(expression: AllValues): this
  setType(type: ContentTypes): this
  setPosition(start: number, end: number): this
  writeToBuffer(buffer: Buffer, offset: number): void
  static fromBuffer(buffer: Buffer): Node[]
}
```

### Content Types

```typescript
enum ContentTypes {
  Boolean = 247,
  String = 248,
  Number = 249,
  Array = 250
}
```

## 🔗 Related Packages

- [@asterflow/router](../router/README.md) - Routing system
- [@asterflow/core](../../core/README.md) - Core framework

## 📄 License

MIT - See [LICENSE](../../LICENSE) for more details.