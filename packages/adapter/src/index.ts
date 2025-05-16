export * from './controllers/Adapter'
export *  from './types/adapter'
import bun from './adapters/bun'
import fastify from './adapters/fastify'
import node from './adapters/node'
import express from './adapters/express'

const adapters = { bun, fastify, node, express }
export { adapters }