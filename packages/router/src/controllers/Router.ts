import type { BaseShapeAbstract } from '@caeljs/config'
import type { AccumulatedMiddlewareOutput } from '../types/method'
import { type MethodKeys, type Responders, type RouteHandler, type RouterOptions, type SchemaDynamic } from '../types/router'
import type { Middleware } from './Middleware'
import type { ZodTypeAny } from 'zod'

export class Router<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  const Routers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, Schema, Middlewares, Context> },
  const Middlewares extends readonly Middleware<Responder, BaseShapeAbstract<any> | ZodTypeAny, string, Record<string, unknown>>[] = [],
  const Context extends AccumulatedMiddlewareOutput<Middlewares> = AccumulatedMiddlewareOutput<Middlewares>,
> {
  readonly name?: string
  readonly path: string
  readonly schema?: RouterOptions<Path, Method, Schema, Responder, Middlewares, Context,  Routers>['schema']
  readonly description?: string
  readonly methods: Routers
  readonly use?: Middlewares

  constructor(options: RouterOptions<Path, Method, Schema, Responder, Middlewares, Context,  Routers>) {
    const { name, path, schema, description, methods } = options
    this.name = name
    this.path = path
    this.schema = schema
    this.description = description
    this.methods = methods
    this.use = options.use
  }
}