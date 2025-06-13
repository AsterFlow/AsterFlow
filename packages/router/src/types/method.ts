import type { AnyAsterflow, AsterFlow } from '@asterflow/core'
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

export type AnyMethodHandler = MethodHandler<string, Responders, AnySchema, AnyMiddleware[], MiddlewareOutput<AnyMiddleware[]>, AsterFlow>
export type MethodKeys = keyof typeof MethodType

export type MethodHandler<
  Path extends string,
  Responder extends Responders,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  Instance extends AnyAsterflow
> = <RequestType> (args: {
  instance: Instance
  request: Request<RequestType>
  response: Response<Responder>
  url: Analyze<Path, ParsePath<Path>, Analyze<Path>>
  schema: InferSchema<Schema>
  middleware: Context,
}) => Promise<Response<Responder>> | Response<Responder>

export type MethodOptions<
  Responder extends Responders,
  Path extends string,
  Method extends MethodKeys,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  Instance extends AnyAsterflow,
  Handler extends MethodHandler<Path, Responder, Schema, Middlewares, Context, Instance>
> = {
  path: Path,
  name?: string,
  description?: string,
  use?: Middlewares
  method: Method,
  schema?: Schema
  handler: Handler
}