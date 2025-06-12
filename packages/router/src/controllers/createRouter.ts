import type { Responders } from '@asterflow/response'
import type { AnySchema, SchemaDynamic } from '../types/schema'
import type { Middleware } from './Middleware'
import type { MethodKeys } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { RouteHandler, RouterOptions } from '../types/router'
import { Router } from './Router'

/**
 * Starts building a Router, setting the expected response types.
 * @returns An object with the `from` method to define the router options.
 */
export function createRouter<Responder extends Responders>() {
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