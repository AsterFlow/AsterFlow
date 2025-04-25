import { BaseShapeAbstract } from '@caeljs/config'
import { type Request as ExpressRequest } from 'express'
import type { FastifyRequest } from 'fastify'
import { IncomingMessage } from 'http'
import { type TypeOf, type ZodTypeAny } from 'zod'
import type { Middleware } from '../controllers/Middleware'
import type { AsterRequest } from '../controllers/Request'
import type { Response } from '../controllers/Response'
import type { MethodKeys, Responders } from './router'

export type AsterRequestTypes = FastifyRequest | Request | IncomingMessage | ExpressRequest;

export type InferSchema<S> = S extends BaseShapeAbstract<any>
  ? ReturnType<S['parse']>
  : S extends ZodTypeAny
  ? TypeOf<S>
  : never

/**
 * Accumulate the output types (`P`) from an array of middlewares into a single object
 */
export type AccumulatedMiddlewareOutput<Ms extends readonly Middleware<any, any, any, any>[]> =
  Ms extends readonly [infer First, ...infer Rest]
    ? First extends Middleware<any, any, any, infer P>
      ? Rest extends readonly Middleware<any, any, any, any>[]
        ? P & AccumulatedMiddlewareOutput<Rest>
        : P
      : unknown
    : unknown

export type MethodHandler<
  Responder extends Responders,
  Schema extends BaseShapeAbstract<any> | ZodTypeAny,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends AccumulatedMiddlewareOutput<Middlewares>,
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
  Schema extends BaseShapeAbstract<any> | ZodTypeAny,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends AccumulatedMiddlewareOutput<Middlewares>,
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