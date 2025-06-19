import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from 'asterflow'
import type { Responders } from '@asterflow/response'
import type { MethodHandler, MethodKeys, MethodOptions } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { AnySchema } from '../types/schema'
import type { Middleware } from './Middleware'

export class Method<
  Responder extends Responders,
  const Path extends string = string,
  const Drive extends Runtime = Runtime,
  const Method extends MethodKeys = MethodKeys,
  const Schema extends AnySchema = AnySchema,
  const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Instance extends AnyAsterflow = AnyAsterflow,
  const Handler extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance> = MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance>,
>{
  path: Path
  method: Method
  schema?: Schema
  
  name?: string
  use?: Middlewares
  handler: Handler

  constructor (options: MethodOptions<Responder, Path, Drive, Method, Schema, Middlewares, Context, Instance, Handler>) {
    this.path = options.path
    this.method = options.method
    this.schema = options.schema
    this.handler = options.handler
    this.use = options.use
  }
}