import type { Runtime } from '@asterflow/adapter'
import type { Request } from '@asterflow/request'
import type { AsterResponse, Responders } from '@asterflow/response'
import type { Analyze } from '@asterflow/url-parser'
import type { Method } from '../controllers/Method'
import type { Middleware } from '../controllers/Middleware'
import type { Router, RouteMethodBuilder } from '../controllers/Router'
import type { MethodKeys } from './method'
import type { AnyMiddleware, MiddlewareOutput } from './mindleware'
import type { AnySchema, InferredData, SchemaDynamic } from './schema'
import type { Prettify } from './utils'

export type AnyRouter =
  Router<any> | Method<any>

/** `Router`'s single generic parameter - the fields it needs to type a finished router. */
export interface RouterProps {
  responder: Responders
  path: string
  schema: SchemaDynamic<MethodKeys>
  middlewares: readonly AnyMiddleware[]
  context: unknown
  routers: Partial<Record<MethodKeys, unknown>>
}

export type DefaultRouterProps = {
  responder: Responders
  path: string
  schema: SchemaDynamic<MethodKeys>
  middlewares: []
  context: unknown
  routers: {}
}

/**
 * Assembles `RouterProps`'s fields from independently-inferred generics into
 * one named object type. Entry points (`Router.create()`, `.builder()`,
 * `AsterFlow.router()`) can't infer a single `Props` object directly from
 * their call site - each field is inferred from a different part of
 * `options`, and contextual typing of the `methods` handlers depends on
 * `Path`/`Responder`/`Schema`/`Middlewares`/`Context` existing as separate
 * type-vars at that point - so they keep independent generics. This alias
 * just replaces the "respell the object literal 2-3x per signature" pattern
 * with one name.
 *
 * Wrapped in `Prettify` so a resolved `Router<RouterCallProps<...>>` shows as
 * a labeled `{ responder: ..., path: "...", ... }` object on hover instead of
 * `RouterCallProps<Responders, "...", ...>` - a positional arg list you'd
 * otherwise have to cross-reference against this declaration to read.
 */
export type RouterCallProps<
  Responder extends Responders,
  Path extends string,
  Schema extends SchemaDynamic<MethodKeys>,
  Middlewares extends readonly AnyMiddleware[],
  Context,
  Routers extends Partial<Record<MethodKeys, unknown>>
> = Prettify<{ responder: Responder, path: Path, schema: Schema, middlewares: Middlewares, context: Context, routers: Routers }>

/** `RouterBuilder`'s single generic parameter - same fields as `RouterProps`, but `routers` accumulates as `.method(...)` is chained. */
export interface RouterBuilderProps {
  responder: Responders
  path: string
  schema: SchemaDynamic<MethodKeys>
  middlewares: readonly AnyMiddleware[]
  context: unknown
  routers: Partial<Record<MethodKeys, unknown>>
}

export type DefaultRouterBuilderProps = {
  responder: Responders
  path: string
  schema: SchemaDynamic<MethodKeys>
  middlewares: []
  context: unknown
  routers: {}
}

/** `RouteMethodBuilder`'s single generic parameter - the fields it needs to type a scoped-to-one-HTTP-method builder. */
export interface RouteMethodBuilderProps {
  responder: Responders
  path: string
  methodKey: MethodKeys
  schema: SchemaDynamic<MethodKeys>
  context: unknown
  requestExt: Record<string, unknown>
}

export type DefaultRouteMethodBuilderProps = {
  responder: Responders
  path: string
  methodKey: MethodKeys
  schema: SchemaDynamic<MethodKeys>
  context: unknown
  requestExt: {}
}

export type AnyRouteMethodBuilder = RouteMethodBuilder<any>

export type RouteHandler<
  Path extends string,
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
  Context,
  > = <RequestType extends Runtime> (args: {
  request: Request<RequestType>
  response: AsterResponse<Responder>;
  url: Analyze<string, Analyze<Path>>
  schema: InferredData<Method, Schema>;
  middleware: Context
}) => Promise<AsterResponse> | AsterResponse

export type RouterOptions<Props extends RouterProps> = {
  name?: string
  description?: string
  path?: Props['path']
  param?: Props['path']
  use?: Props['middlewares'],
  schema?: Props['schema']
  methods: Props['routers']
}

/** `RouterBuilder`'s constructor options: `RouterOptions` minus `methods` - each method is added via `.method(key, ...)` instead. */
export type RouterBuilderOptions<Props extends RouterBuilderProps> = {
  name?: string
  description?: string
  path?: Props['path']
  param?: Props['path']
  use?: Props['middlewares']
  schema?: Props['schema']
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
