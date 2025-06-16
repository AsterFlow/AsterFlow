import type { Runtime } from '@asterflow/adapter'
import type { Request as ERequest } from 'express'
import type { FastifyRequest as FRequest } from 'fastify'
import { IncomingMessage } from 'http'

export interface RequestType {
  [Runtime.Bun]: Request,
  [Runtime.Express]: ERequest,
  [Runtime.Fastify]: FRequest,
  [Runtime.Node]: IncomingMessage
}