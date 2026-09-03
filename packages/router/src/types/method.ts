import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from 'asterflow'
import type { AsterRequest } from '@asterflow/request'
import type { Responders, AsterResponse } from '@asterflow/response'
import type { Analyze } from '@asterflow/url-parser'
import type { Middleware } from '../controllers/Middleware'
import type { AnyMiddleware, MiddlewareOutput } from './mindleware'
import type { AnySchema, InferSchema } from './schema'

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

export type AnyMethodHandler = MethodHandler<string, Runtime, Responders, AnySchema, AnyMiddleware[], MiddlewareOutput<AnyMiddleware[]>, AnyAsterflow>
export type MethodKeys = keyof typeof MethodType

export type MethodHandler<
  Path extends string,
  Drive extends Runtime,
  Responder extends Responders,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
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

export type MethodOptions<
  Responder extends Responders,
  Path extends string,
  Drive extends Runtime,
  Method extends MethodKeys,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  Instance extends AnyAsterflow,
  Handler extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance>
> = {
  path?: Path,
  param?: Path,
  name?: string,
  description?: string,
  use?: Middlewares
  method: Method,
  schema?: Schema
  handler: Handler
}

/**
 * `Method.create(...)`'s options: everything `MethodOptions` has except
 * `handler`, supplied later via the terminal `.handler()` call instead.
 */
export type MethodBuilderOptions<
  Path extends string,
  Method extends MethodKeys,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<any, Schema, string, Record<string, unknown>>[]
> = {
  path?: Path
  param?: Path
  name?: string
  description?: string
  use?: Middlewares
  method: Method
  schema?: Schema
}

/**
 * `RequestExt`'s keys replace (not merely add to) the base request's -
 * `Omit` then intersect, so a plugin's narrowed method (e.g. multipart's
 * `getFile`) is the only signature available, not an extra overload.
 */
export type ExtendedRequest<
  Drive extends Runtime,
  RequestExt extends Record<string, unknown>
> = Omit<AsterRequest<Drive>, keyof RequestExt> & RequestExt
