import type { Request } from '@asterflow/request'
import type { Responders, Response } from '@asterflow/response'
import type { Analyze, ParsePath } from 'url-ast'
import type { Middleware } from '../controllers/Middleware'
import type { AnyMiddleware, MiddlewareOutput } from './mindleware'
import type { AnySchema, InferSchema } from './schema'

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

export type AnyMethodHandler =  { [Method in MethodKeys]?: MethodHandler<string, Responders, AnySchema, AnyMiddleware[], MiddlewareOutput<AnyMiddleware[]>>; }
export type MethodHandler<
  Path extends string,
  Responder extends Responders,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>
> = <RequestType> (args: {
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
  Handler extends MethodHandler<Path, Responder, Schema, Middlewares, Context>
> = {
  path: Path,
  name?: string,
  description?: string,
  use?: Middlewares
  method: Method,
  schema?: Schema
  handler: Handler
}