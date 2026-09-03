import type { Runtime } from '@asterflow/adapter'
import type { Request } from '@asterflow/request'
import type { AsterResponse, Responders } from '@asterflow/response'
import type { Analyze } from '@asterflow/url-parser'
import type { Method } from '../controllers/Method'
import type { Middleware } from '../controllers/Middleware'
import type { Router } from '../controllers/Router'
import type { MethodKeys } from './method'
import type { AnyMiddleware, MiddlewareOutput } from './mindleware'
import type { AnySchema, InferredData, SchemaDynamic } from './schema'

export type AnyRouteHandler =  { [Method in MethodKeys]?: RouteHandler<string, Responders, Method, SchemaDynamic<Method>, AnyMiddleware[], MiddlewareOutput<AnyMiddleware[]>>; }
export type AnyRouter =
  Router<any, any, any, any, any, any> | Method<any, any, any, any, any, any, any, any, any, any>

export type RouteHandler<
  Path extends string,
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  > = <RequestType extends Runtime> (args: {
  request: Request<RequestType>
  response: AsterResponse<Responder>;
  url: Analyze<string, Analyze<Path>>
  schema: InferredData<Method, Schema>;
  middleware: Context
}) => Promise<AsterResponse> | AsterResponse

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
  path?: Path
  param?: Path
  use?: Middlewares,
  schema?: Schema
  methods: Routers
}

/** `RouterBuilder`'s constructor options: `RouterOptions` minus `methods` - each method is added via `.method(key, ...)` instead. */
export type RouterBuilderOptions<
  Path extends string,
  Schema extends SchemaDynamic<MethodKeys>,
  Middlewares extends readonly Middleware<any, AnySchema, string, Record<string, unknown>>[]
> = {
  name?: string
  description?: string
  path?: Path
  param?: Path
  use?: Middlewares
  schema?: Schema
}

/** A single HTTP method's handler on a `RouterBuilder`, with `RequestExt` replacing (not merely adding to) the base request's matching keys - same `Omit`-then-intersect as `ExtendedRequest`. */
export type RouteBuilderHandler<
  Path extends string,
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Context,
  RequestExt extends Record<string, unknown>
  > = <RequestType extends Runtime> (args: {
  request: Omit<Request<RequestType>, keyof RequestExt> & RequestExt
  response: AsterResponse<Responder>;
  url: Analyze<string, Analyze<Path>>
  schema: InferredData<Method, Schema>;
  middleware: Context
}) => Promise<AsterResponse> | AsterResponse

/** What a `RouterBuilder.method(key, build)` callback must return - built via `RouteMethodBuilder`. */
export type BuiltRouteHandler<Handler> = {
  handler: Handler
  registrations: Record<string, unknown>
}
