import { type Request as ExpressRequest } from 'express'
import type { FastifyRequest } from 'fastify'
import { IncomingMessage } from 'http'
import type { Middleware } from '../controllers/Middleware'
import type { AsterRequest } from '../controllers/Request'
import type { Response } from '../controllers/Response'
import type { MethodKeys, Responders } from './router'
import type { AnySchema, InferSchema } from './schema'
import type { MiddlewareOutput } from './mindleware'

export type AsterRequestTypes = FastifyRequest | Request | IncomingMessage | ExpressRequest;

export type MethodHandler<
  Responder extends Responders,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
> =(args: {
  response: Response<Responder>;
  request: AsterRequest<AsterRequestTypes>
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
  Handler extends MethodHandler<Responder, Schema, Middlewares, Context>,
> = {
  path: Path,
  name?: string,
  description?: string,
  use?: Middlewares
  method: Method,
  schema?: Schema
  handler: Handler
}