import type { Runtime } from '@asterflow/adapter'
import type { Request } from '@asterflow/request'
import type { Responders, Response } from '@asterflow/response'
import type { Analyze, ParsePath } from '@asterflow/url-parser'
import type { Method } from '../controllers/Method'
import type { Middleware } from '../controllers/Middleware'
import type { Router } from '../controllers/Router'
import type { MethodKeys } from './method'
import type { AnyMiddleware, MiddlewareOutput } from './mindleware'
import type { AnySchema, InferredData, SchemaDynamic } from './schema'

export type AnyRouteHandler =  { [Method in MethodKeys]?: RouteHandler<string, Responders, Method, SchemaDynamic<Method>, AnyMiddleware[], MiddlewareOutput<AnyMiddleware[]>>; }
export type AnyRouter =
  Router<any, any, any, any, any, any> | Method<any, any, any, any, any, any, any, any, any>

export type RouteHandler<
  Path extends string,
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  > = <RequestType extends Runtime> (args: {
  request: Request<RequestType>
  response: Response<Responder>;
  url: Analyze<Path, ParsePath<Path>, Analyze<Path>>
  schema: InferredData<Method, Schema>;
  middleware: Context
}) => Promise<Response> | Response

export type RouterOptions<
  Path extends string,
  Schema extends SchemaDynamic<MethodKeys>,
  Responder extends Responders,
  Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> },
> = {
  name?: string
  description?: string
  path: Path
  use?: Middlewares,
  schema?: Schema
  methods: Routers
}