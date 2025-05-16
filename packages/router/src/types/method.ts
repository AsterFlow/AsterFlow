import type { Request } from '@asterflow/request'
import type { Middleware } from '../controllers/Middleware'
import type { Response } from '../controllers/Response'
import type { MiddlewareOutput } from './mindleware'
import type { MethodKeys, Responders } from './router'
import type { AnySchema, InferSchema } from './schema'
import type { Analyze } from '@asterflow/url-parser'

export type MethodHandler<
  Responder extends Responders,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>
> = <RequestType> (args: {
  request: Request<RequestType>
  response: Response<Responder>
  url: Analyze<any, any, Analyze<any, any>>
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
  Handler extends MethodHandler<Responder, Schema, Middlewares, Context>
> = {
  path: Path,
  name?: string,
  description?: string,
  use?: Middlewares
  method: Method,
  schema?: Schema
  handler: Handler
}