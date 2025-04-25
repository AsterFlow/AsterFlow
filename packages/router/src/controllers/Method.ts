import type { BaseShapeAbstract } from '@caeljs/config'
import type { ZodTypeAny } from 'zod'
import type { AccumulatedMiddlewareOutput, MethodHandler, MethodOptions } from '../types/method'
import type { MethodKeys, Responders } from '../types/router'
import type { Middleware } from './Middleware'

export class Method<
  Responder extends Responders,
  const Path extends string = string,
  const Method extends MethodKeys = MethodKeys,
  const Schema extends BaseShapeAbstract<any> | ZodTypeAny = ZodTypeAny,
  const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
  const Params extends AccumulatedMiddlewareOutput<Middlewares> = AccumulatedMiddlewareOutput<Middlewares>,
  const Handler extends MethodHandler<Responder, Schema, Middlewares, Params> = MethodHandler<Responder, Schema, Middlewares, Params>,
>{
  path: Path
  method: Method
  schema?: Schema
  
  name?: string
  use?: Middlewares
  handler: Handler

  constructor (options: MethodOptions<Responder, Path, Method, Schema, Middlewares, Params, Handler>) {
    this.path = options.path
    this.method = options.method
    this.schema = options.schema
    this.handler = options.handler
    this.use = options.use
  }
}