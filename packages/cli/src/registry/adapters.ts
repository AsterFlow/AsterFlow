export interface AdapterDefinition {
  id: string
  label: string
  /** npm package name, or `null` when the adapter needs no extra dependency (bun/node are built in). */
  dependency: string | null
  /** Import lines needed at the top of the generated entry file, beyond `adapters` itself. */
  imports: string[]
  /** Expression passed as `driver` to `new AsterFlow({ driver: ... })`. */
  driverExpression: string
  /** Statement placed before the exported chain, e.g. `const server = express()`. `null` when nothing is needed. */
  preamble: string | null
  /** Everything after `.listen` - arguments and callback - appended to the exported chain. */
  listenCall: string
}

export const ADAPTER_REGISTRY: Record<string, AdapterDefinition> = {
  bun: {
    id: 'bun',
    label: 'Bun (native Bun.serve)',
    dependency: null,
    imports: [],
    driverExpression: 'adapters.bun',
    preamble: null,
    listenCall: `({ port: 3333 }, (err) => {
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
    preamble: null,
    listenCall: `({ port: 3333 }, (err) => {
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
    imports: ['import express from \'express\''],
    driverExpression: 'adapters.express',
    preamble: 'const server = express()',
    listenCall: `(server, 3333, () => {
    console.log('Server listening on http://localhost:3333')
  })`
  },
  fastify: {
    id: 'fastify',
    label: 'Fastify',
    dependency: 'fastify',
    imports: ['import fastify from \'fastify\''],
    driverExpression: 'adapters.fastify',
    preamble: 'const server = fastify()',
    listenCall: `(server, { port: 3333 }, (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log('Server listening on http://localhost:3333')
  })`
  }
}

export const ADAPTER_IDS = Object.keys(ADAPTER_REGISTRY)
