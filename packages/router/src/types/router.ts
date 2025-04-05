import type { FastifyRequest } from 'fastify'
import type { z, ZodTypeAny } from 'zod'
import type { Response } from '../controllers/response'
/*
 * Enum for HTTP method types.
 */
export enum MethodType {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  socket = 'socket'
}

export type MethodKeys = keyof typeof MethodType

export type Responders = { [x in number]: unknown }
export type SchemaDynamic<M extends MethodKeys> = { [K in M]?: ZodTypeAny }

export type ZodInferredData<
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
> = Schema[Method] extends z.ZodTypeAny
  ? z.infer<Schema[Method]>
  : unknown

export type RouteHandler<
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  > = (args: {
  request: FastifyRequest
  response: Response<Responder>;
  schema: ZodInferredData<Method, Schema>;
}) => Response

export type RouterOptions<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, Schema> },
> = {
  name?: string
  description?: string
  path: Path
  schema?: Schema
  methods: Routers
}