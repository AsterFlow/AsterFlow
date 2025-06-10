import { Analyze } from 'url-ast'
import type { MethodHandler, MethodKeys, MethodOptions } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { Responders } from '../types/response'
import type { AnySchema } from '../types/schema'
import type { Middleware } from './Middleware'

export class Method<
  Responder extends Responders,
  const Path extends string = string,
  const Method extends MethodKeys = MethodKeys,
  const Schema extends AnySchema = AnySchema,
  const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Handler extends MethodHandler<Path, Responder, Schema, Middlewares, Context> = MethodHandler<Path, Responder, Schema, Middlewares, Context>,
>{
  path: Path
  url: Analyze<Path>
  method: Method
  schema?: Schema
  
  name?: string
  use?: Middlewares
  handler: Handler

  constructor (options: MethodOptions<Responder, Path, Method, Schema, Middlewares, Context, Handler>) {
    this.path = options.path
    this.url = new Analyze(this.path)
    this.method = options.method
    this.schema = options.schema
    this.handler = options.handler
    this.use = options.use
  }
}