import { type MethodKeys, type Responders, type RouteHandler, type RouterOptions, type SchemaDynamic } from '../types/router'

export class Router<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, Schema> },
> {
  public name?: string
  public path: string
  public schema?: RouterOptions<Path, Method, Schema, Routers, Responder>['schema']
  public description?: string
  public methods: Routers

  constructor(options: RouterOptions<Path, Method, Schema, Responder, Routers>) {
    const { name, path, schema, description, methods } = options
    this.name = name
    this.path = path
    this.schema = schema
    this.description = description
    this.methods = methods
  }
}