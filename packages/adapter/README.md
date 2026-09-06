<div align="center">

# @asterflow/adapter

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=packages%2Fadapter&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/adapter?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Wires a runtime's native server (Bun.serve, Node's `http`, Express, Fastify) into AsterFlow, converting native requests to `Request` and sending back `AsterResponse` the same way regardless of runtime.

## 📦 Installation

```bash
bun install @asterflow/adapter
```

### ✨ Features

- **`adapters`** - a ready-made `Adapter` instance for each runtime: `adapters.bun`, `adapters.node`, `adapters.express`, `adapters.fastify`
- **`Runtime`** - the enum (`Bun`, `Node`, `Express`, `Fastify`) that types requests, listen arguments, and adapters to their runtime
- **`Adapter`** - a small class holding a `runtime`, a `listen(...)` function typed to that runtime's native `listen`/`serve` signature, and an `onRequest` hook that AsterFlow assigns to route native requests into its handler
- **Request conversion per runtime** - each adapter calls the matching `create*Request` factory from `@asterflow/request` (`createBunRequest`, `createNodeRequest`, `createExpressRequest`, `createFastifyRequest`) before handing the request to `onRequest`
- **Fallback response** - if `listen()` is called before `onRequest` is set, every adapter responds with a 500 instead of crashing
- **Error-to-response conversion** - `toErrorResponse(err)` turns a thrown value (an `Error`, an already-built `AsterResponse`, or anything else) into a JSON `AsterResponse`; the Node adapter uses it to catch per-request errors and return a 500 instead of hanging the connection

## ❓ How to Use

Pick an adapter and pass it as the `driver` when creating an AsterFlow app — everything else (routes, `.listen()`) stays the same:

```ts
import { AsterFlow } from 'asterflow'
import { adapters } from '@asterflow/adapter'

const app = new AsterFlow({ driver: adapters.bun }) // or adapters.node, adapters.express, adapters.fastify

app.listen({ port: 3000 })
```

Express and Fastify need their own instance passed through `listen`, since AsterFlow mounts a catch-all route on it rather than starting its own server:

```ts
import { AsterFlow } from 'asterflow'
import { adapters } from '@asterflow/adapter'
import express from 'express'

const app = new AsterFlow({ driver: adapters.express })

app.listen(express(), 3000)
```

## 🔗 Related Packages

- [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - supplies the `create*Request` factories each adapter calls to build a typed `Request` from the runtime's native one
- [@asterflow/response](https://www.npmjs.com/package/@asterflow/response) - `AsterResponse` is what `onRequest` must return; adapters convert it to the runtime's native response and use it to build fallback/error responses
- Depended on by [asterflow](https://www.npmjs.com/package/asterflow) - the core framework picks a `driver` from `adapters`, sets its `onRequest`, and delegates `app.listen(...)` to `driver.listen(...)`

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
