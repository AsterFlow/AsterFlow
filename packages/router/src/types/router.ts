import type { Middleware } from '../controllers/Middleware'
import type { AsterRequest } from '../controllers/Request'
import type { Response } from '../controllers/Response'
import type { AsterRequestTypes } from './method'
import type { AnySchema, InferSchema, SchemaDynamic } from './schema'
import type { Method } from '../controllers/Method'
import type { Router } from '../controllers/Router'
import type { MiddlewareOutput } from './mindleware'
/*
 * Enum for HTTP method types.
 */
export enum MethodType {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
}

export type MethodKeys = keyof typeof MethodType
export type Responders = { [x in number]: unknown }
export type AnyRouter = Router<any, any, any, any, any, any, any> | Method<any, any, any, any, any, any, any>

export type InferredData<
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
> = InferSchema<Schema[Method]>

export type RouteHandler<
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  > = (args: {
  request: AsterRequest<AsterRequestTypes>
  response: Response<Responder>;
  schema: InferredData<Method, Schema>;
  middleware: Context
}) => Promise<Response> | Response

export type RouterOptions<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, Schema, Middlewares, Context> },
> = {
  name?: string
  description?: string
  path: Path
  use?: Middlewares,
  schema?: Schema
  methods: Routers
}