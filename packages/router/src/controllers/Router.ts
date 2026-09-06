import type { Responders } from '@asterflow/response'
import type { MethodKeys } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type {
  BuiltRouteHandler,
  DefaultRouterProps,
  DefaultRouteMethodBuilderProps,
  DefaultRouterBuilderProps,
  RouteBuilderHandler,
  RouteHandler,
  RouteMethodBuilderProps,
  RouterBuilderOptions,
  RouterBuilderProps,
  RouterCallProps,
  RouterOptions,
  RouterProps
} from '../types/router'
import type { AnySchema, SchemaDynamic } from '../types/schema'
import type { MergeProps } from '../types/utils'
import type { Middleware } from './Middleware'
import { setRouteExtensions } from './extensionRegistry'

export class Router<
  const Props extends RouterProps = DefaultRouterProps
> {
  name?: string
  path: Props['path']
  param?: Props['path']
  schema?: Props['schema']
  description?: string
  methods: Props['routers']
  use?: Props['middlewares']

  constructor(options: RouterOptions<Props>) {
    const { name, path, param, schema, description, methods } = options
    this.name = name
    this.path = (path ?? param) as Props['path']
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
      options: RouterOptions<RouterCallProps<Responder, Path, Schema, Middlewares, Context, Routers>>
    ): Router<RouterCallProps<Responder, Path, Schema, Middlewares, Context, Routers>> => {
      return new Router(options)
    }
  }

  /**
   * Entry point for the extensible builder (`RouterBuilder`, which extends
   * `Router` itself): each HTTP method is added via `.method(key, ...)`
   * instead of one `methods: {...}` object, so plugins can chain in
   * per-method `request` extensions, e.g.
   * `Router.builder({ use: [authMiddleware] }).method('post', b => b.multipart({...}).handler(...))`.
   * `options` is entirely optional (name/path/use/schema) - `Router.builder()`
   * with no arguments at all is valid too. The result is already a real
   * `Router` - no finalization call needed.
   */
  static builder<
    Responder extends Responders,
    const Path extends string = string,
    const Schema extends SchemaDynamic<MethodKeys> = SchemaDynamic<MethodKeys>,
    const Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[] = [],
  >(
    options?: RouterBuilderOptions<RouterCallProps<Responder, Path, Schema, Middlewares, MiddlewareOutput<Middlewares>, {}>>
  ): RouterBuilder<RouterCallProps<Responder, Path, Schema, Middlewares, MiddlewareOutput<Middlewares>, {}>> {
    return new RouterBuilder(options)
  }
}

/**
 * Scoped to a single HTTP method within a `RouterBuilder.method(key, ...)`
 * call - plugins' chain methods work identically here as on `Method` (same
 * `extend` primitive), but the accumulated `RequestExt` only ever
 * affects *this* method's handler, not sibling methods on the same router.
 */
export class RouteMethodBuilder<
  const Props extends RouteMethodBuilderProps = DefaultRouteMethodBuilderProps
> {
  private readonly registrations: Record<string, unknown> = {}

  extend<E extends Record<string, unknown>>(
    _typeFragment: E,
    runtimeData?: Record<string, unknown>
  ): RouteMethodBuilder<MergeProps<Props, { requestExt: Props['requestExt'] & E }>> {
    if (runtimeData) Object.assign(this.registrations, runtimeData)
    return this as unknown as RouteMethodBuilder<MergeProps<Props, { requestExt: Props['requestExt'] & E }>>
  }

  handler<Handler extends RouteBuilderHandler<Props['path'], Props['responder'], Props['methodKey'], Props['schema'], Props['context'], Props['requestExt']>>(
    fn: Handler
  ): BuiltRouteHandler<Handler> {
    return { handler: fn, registrations: this.registrations }
  }
}

/**
 * The extensible counterpart to `new Router({...})`. Each HTTP method is
 * added via `.method(key, builder => builder.somePluginExtension({...}).handler(...))`,
 * so different methods on the same router can have independently typed
 * `request` extensions - e.g. `multipart` criteria declared for `post` only.
 *
 * Extends `Router` directly rather than staging into a separate object: each
 * `.method(...)` call mutates `this.methods` in place and returns `this`, so
 * the instance is a real, usable `Router` from the moment `Router.builder(...)`
 * is called (`instanceof Router` holds immediately) - no finalization step.
 * Same self-completing shape as `Method.create(...)`'s pending `handler`.
 *
 * Defined in this same file (not a separate one) because it extends `Router`
 * at class-definition time - splitting the two across mutually-importing
 * modules creates a circular value import, which throws
 * "Cannot access 'Router' before initialization" depending on load order.
 */
export class RouterBuilder<
  const Props extends RouterBuilderProps = DefaultRouterBuilderProps
> extends Router<Props> {
  private readonly perMethodRegistrations: Partial<Record<MethodKeys, Record<string, unknown>>> = {}

  constructor(options: RouterBuilderOptions<Props> = {}) {
    super({ ...options, methods: {} } as RouterOptions<Props>)
  }

  method<
    MethodKey extends MethodKeys,
    Handler
  >(
    key: MethodKey,
    build: (builder: RouteMethodBuilder<{ responder: Props['responder'], path: Props['path'], methodKey: MethodKey, schema: Props['schema'], context: Props['context'], requestExt: {} }>) => BuiltRouteHandler<Handler>
  ): RouterBuilder<MergeProps<Props, { routers: Props['routers'] & Record<MethodKey, Handler> }>> {
    const built = build(new RouteMethodBuilder())
    ;(this.methods as Partial<Record<MethodKeys, unknown>>)[key] = built.handler

    if (Object.keys(built.registrations).length > 0) {
      this.perMethodRegistrations[key] = built.registrations
      setRouteExtensions(this, this.perMethodRegistrations)
    }

    return this as unknown as RouterBuilder<MergeProps<Props, { routers: Props['routers'] & Record<MethodKey, Handler> }>>
  }
}
