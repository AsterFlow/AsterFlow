import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from 'asterflow'
import type { AsterRequest } from '@asterflow/request'
import type { Responders, AsterResponse } from '@asterflow/response'
import type { Analyze } from '@asterflow/url-parser'
import type { Method } from '../controllers/Method'
import type { Middleware } from '../controllers/Middleware'
import type { AnyMiddleware, MiddlewareOutput } from './mindleware'
import type { AnySchema, InferSchema } from './schema'
import type { Prettify } from './utils'

/*
 * Enum for HTTP method types.
 */
export enum MethodType {
  all = 'all',
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  options = 'options',
  head = 'head',
  patch = 'patch'
}

export type MethodKeys = keyof typeof MethodType

/** `Method`'s single generic parameter - the fields it needs to type a single route. */
export interface MethodProps {
  responder: Responders
  path: string
  drive: Runtime
  methodKey: MethodKeys
  schema: AnySchema
  middlewares: readonly AnyMiddleware[]
  context: unknown
  instance: AnyAsterflow
  requestExt: Record<string, unknown>
  // Loose on purpose: `handler` sits in a contravariant (function parameter)
  // position, so pinning this to a fully-resolved `MethodHandler<...>` would
  // make the constraint unsatisfiable by any handler typed with a narrower
  // `Instance` than `AnyAsterflow` (e.g. `AsterFlowInstance<Drive, ...>`).
  handler: ((args: any) => any) | undefined
}

export type AnyMethod = Method<any>

/**
 * Assembles `MethodProps`'s fields from independently-inferred generics into
 * one named object type - same rationale as `RouterCallProps` in
 * `types/router.ts`: `Method.create()`/`AsterFlow.method()` keep their own
 * independent generics (needed for contextual typing of the handler
 * callback), this alias just replaces the repeated object-literal with a name.
 *
 * Wrapped in `Prettify` so a resolved `Method<MethodCallProps<...>>` shows as
 * a labeled `{ responder: ..., path: "...", ... }` object on hover instead of
 * `MethodCallProps<Responders, "...", Runtime.Node, "post", ...>` - a
 * positional arg list you'd otherwise have to cross-reference against this
 * declaration to read.
 */
export type MethodCallProps<
  Responder extends Responders,
  Path extends string,
  Drive extends Runtime,
  MethodKey extends MethodKeys,
  Schema extends AnySchema,
  Middlewares extends readonly AnyMiddleware[],
  Context,
  Instance extends AnyAsterflow,
  RequestExt extends Record<string, unknown>,
  Handler
> = Prettify<{ responder: Responder, path: Path, drive: Drive, methodKey: MethodKey, schema: Schema, middlewares: Middlewares, context: Context, instance: Instance, requestExt: RequestExt, handler: Handler }>

export type DefaultMethodProps = {
  responder: Responders
  path: string
  drive: Runtime
  methodKey: MethodKeys
  schema: AnySchema
  middlewares: []
  context: MiddlewareOutput<[]>
  instance: AnyAsterflow
  requestExt: {}
  handler: MethodHandler<string, Runtime, Responders, AnySchema, [], MiddlewareOutput<[]>, AnyAsterflow, {}>
}

export type MethodHandler<
  Path extends string,
  Drive extends Runtime,
  Responder extends Responders,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context,
  Instance extends AnyAsterflow,
  RequestExt extends Record<string, unknown> = {}
> = (args: {
  instance: Instance
  request: ExtendedRequest<Drive, RequestExt>
  response: AsterResponse<Responder>
  url: Analyze<string, Analyze<Path>>
  schema: InferSchema<Schema>
  middleware: Context,
}) => Promise<AsterResponse<Responder>> | AsterResponse<Responder>

export type MethodOptions<Props extends MethodProps> = {
  path?: Props['path'],
  param?: Props['path'],
  name?: string,
  description?: string,
  use?: Props['middlewares']
  method: Props['methodKey'],
  schema?: Props['schema']
  handler: MethodHandler<Props['path'], Props['drive'], Props['responder'], Props['schema'], Props['middlewares'], Props['context'], Props['instance']>
}

/**
 * `new Method(method, options)`'s second argument - everything
 * `MethodOptions` has except `method` itself, which is passed positionally
 * instead of repeated inside the options object.
 */
export type MethodConstructorOptions<Props extends MethodProps> = Omit<MethodOptions<Props>, 'method'>

/**
 * `Method.create(method, options?)`'s second argument: everything
 * `MethodConstructorOptions` has except `handler`, supplied later via the
 * terminal `.handler()` call instead. Every remaining field is optional, so
 * this argument can be omitted entirely, e.g. `Method.create(Method.POST)`.
 */
export type MethodBuilderOptions<Props extends MethodProps> = Omit<MethodConstructorOptions<Props>, 'handler'>

/**
 * `RequestExt`'s keys replace (not merely add to) the base request's -
 * `Omit` then intersect, so a plugin's narrowed method (e.g. multipart's
 * `getFile`) is the only signature available, not an extra overload.
 */
export type ExtendedRequest<
  Drive extends Runtime,
  RequestExt extends Record<string, unknown>
> = Omit<AsterRequest<Drive>, keyof RequestExt> & RequestExt
