import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from '@asterflow/core'
import type { Request } from '@asterflow/request'
import type { Responders, Response } from '@asterflow/response'
import type { Analyze, ParsePath } from '@asterflow/url-parser'
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
  Instance extends AnyAsterflow
> = (args: {
  instance: Instance
  request: Request<Drive>
  response: Response<Responder>
  url: Analyze<Path, ParsePath<Path>, Analyze<Path>>
  schema: InferSchema<Schema>
  middleware: Context,
}) => Promise<Response<Responder>> | Response<Responder>

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
  path: Path,
  name?: string,
  description?: string,
  use?: Middlewares
  method: Method,
  schema?: Schema
  handler: Handler
}