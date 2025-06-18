import type { Responders } from '@asterflow/response'
import { Analyze } from '@asterflow/url-parser'
import type { MethodKeys } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { RouteHandler, RouterOptions } from '../types/router'
import type { AnySchema, SchemaDynamic } from '../types/schema'
import type { Middleware } from './Middleware'

export class Router<
  Responder extends Responders,
  const Path extends string = string,
  const Schema extends SchemaDynamic<MethodKeys> = SchemaDynamic<MethodKeys>,
  const Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> } = { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> },
> {
  name?: string
  path: Path
  schema?: Schema
  description?: string
  methods: Routers
  use?: Middlewares
  url: Analyze<Path>

  constructor(options: RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>) {
    const { name, path, schema, description, methods } = options
    this.name = name
    this.path = path
    this.schema = schema
    this.description = description
    this.methods = methods
    this.use = options.use
    this.url = new Analyze(this.path)
  }

  static create<Responder extends Responders>() {
    return <
    const Path extends string,
    const Schema extends SchemaDynamic<MethodKeys>,
    const Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
    const Context extends MiddlewareOutput<Middlewares>,
    const Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> }
  >(
      options: RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>
    ): Router<Responder, Path, Schema, Middlewares, Context, Routers> => {
      return new Router(options)
    }
  }
}