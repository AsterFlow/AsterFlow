export interface AdapterDefinition {
  id: string
  label: string
  /** npm package name, or `null` when the adapter needs no extra dependency (bun/node are built in). */
  dependency: string | null
  /** Import lines needed at the top of the generated entry file, beyond `adapters` itself. */
  imports: string[]
  /** Expression passed as `driver` to `new AsterFlow({ driver: ... })`. */
  driverExpression: string
  /** Full `app.listen(...)` call (or block) placed at the end of the generated entry file. */
  listenSnippet: string
}

export const ADAPTER_REGISTRY: Record<string, AdapterDefinition> = {
  bun: {
    id: 'bun',
    label: 'Bun (native Bun.serve)',
    dependency: null,
    imports: [],
    driverExpression: 'adapters.bun',
    listenSnippet: `app.listen({ port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening on http://localhost:3333')
})`
  },
  node: {
    id: 'node',
    label: 'Node.js (native http)',
    dependency: null,
    imports: [],
    driverExpression: 'adapters.node',
    listenSnippet: `app.listen({ port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening on http://localhost:3333')
})`
  },
  express: {
    id: 'express',
    label: 'Express',
    dependency: 'express',
    imports: [`import express from 'express'`],
    driverExpression: 'adapters.express',
    listenSnippet: `const server = express()

app.listen(server, 3333, () => {
  console.log('Server listening on http://localhost:3333')
})`
  },
  fastify: {
    id: 'fastify',
    label: 'Fastify',
    dependency: 'fastify',
    imports: [`import fastify from 'fastify'`],
    driverExpression: 'adapters.fastify',
    listenSnippet: `const server = fastify()

app.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening on http://localhost:3333')
})`
  }
}

export const ADAPTER_IDS = Object.keys(ADAPTER_REGISTRY)
