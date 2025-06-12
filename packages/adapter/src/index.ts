export * from './controllers/Adapter'
export * from './types/adapter'
import bun from './adapters/bun'
import express from './adapters/express'
import fastify from './adapters/fastify'
import node from './adapters/node'

const adapters = { bun, fastify, node, express }
export { adapters }