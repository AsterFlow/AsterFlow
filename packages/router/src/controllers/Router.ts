import { Analyze } from 'url-ast'
import type { MiddlewareOutput } from '../types/mindleware'
import { type MethodKeys, type Responders, type RouteHandler, type RouterOptions } from '../types/router'
import type { AnySchema, SchemaDynamic } from '../types/schema'
import type { Middleware } from './Middleware'

export class Router<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  const Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> },
  const Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
> {
  readonly name?: string
  readonly path: Path
  readonly schema?: Schema
  readonly description?: string
  readonly methods: Routers
  readonly use?: Middlewares
  readonly url: Analyze<Path>

  constructor(options: RouterOptions<Path, Method, Schema, Responder, Middlewares, Context, Routers>) {
    const { name, path, schema, description, methods } = options
    this.name = name
    this.path = path
    this.schema = schema
    this.description = description
    this.methods = methods
    this.use = options.use
    this.url = new Analyze(this.path)
  }
}