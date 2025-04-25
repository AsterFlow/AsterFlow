import type { z, ZodTypeAny } from 'zod'
import type { Response } from '../controllers/Response'
import type { AsterRequest } from '../controllers/Request'
import type { AccumulatedMiddlewareOutput, AsterRequestTypes } from './method'
import type { BaseShapeAbstract } from '@caeljs/config'
import type { Middleware } from '../controllers/Middleware'
/*
 * Enum for HTTP method types.
 */
export enum MethodType {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  socket = 'socket'
}

export type MethodKeys = keyof typeof MethodType
export type Responders = { [x in number]: unknown }
export type SchemaDynamic<M extends MethodKeys> = { [K in M]?: BaseShapeAbstract<any> | ZodTypeAny }

export type ZodInferredData<
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
> = Schema[Method] extends z.ZodTypeAny
  ? z.infer<Schema[Method]>
  : unknown

export type RouteHandler<
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Middlewares extends readonly Middleware<Responder, ZodTypeAny | BaseShapeAbstract<any>, string, Record<string, unknown>>[],
  Context extends AccumulatedMiddlewareOutput<Middlewares>,
  > = (args: {
  request: AsterRequest<AsterRequestTypes>
  response: Response<Responder>;
  schema: ZodInferredData<Method, Schema>;
  middleware: Context
}) => Promise<Response> | Response

export type RouterOptions<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  Middlewares extends readonly Middleware<Responder, ZodTypeAny | BaseShapeAbstract<any>, string, Record<string, unknown>>[],
  Context extends AccumulatedMiddlewareOutput<Middlewares>,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, Schema, Middlewares, Context> },
> = {
  name?: string
  description?: string
  path: Path
  use?: Middlewares,
  schema?: Schema
  methods: Routers
}