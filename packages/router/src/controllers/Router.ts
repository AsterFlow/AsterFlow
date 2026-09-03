import type { Responders } from '@asterflow/response'
import type { MethodKeys } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { RouteHandler, RouterBuilderOptions, RouterOptions } from '../types/router'
import type { AnySchema, SchemaDynamic } from '../types/schema'
import type { Middleware } from './Middleware'
import { RouterBuilder } from './RouterBuilder'

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
  param?: Path
  schema?: Schema
  description?: string
  methods: Routers
  use?: Middlewares

  constructor(options: RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>) {
    const { name, path, param, schema, description, methods } = options
    this.name = name
    this.path = (path ?? param) as Path
    this.schema = schema
    this.description = description
    this.methods = methods
    this.use = options.use
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

  /**
   * Entry point for the extensible builder (`RouterBuilder`): each HTTP
   * method is added via `.method(key, ...)` instead of one `methods: {...}`
   * object, so plugins can chain in per-method `request` extensions, e.g.
   * `Router.builder({...}).method('post', b => b.multipart({...}).handler(...)).build()`.
   */
  static builder<
    Responder extends Responders,
    const Path extends string = string,
    const Schema extends SchemaDynamic<MethodKeys> = SchemaDynamic<MethodKeys>,
    const Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[] = [],
  >(
    options: RouterBuilderOptions<Path, Schema, Middlewares>
  ): RouterBuilder<Responder, Path, Schema, Middlewares> {
    return new RouterBuilder(options)
  }
}
