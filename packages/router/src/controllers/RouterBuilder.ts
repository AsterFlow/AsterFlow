import type { Responders } from '@asterflow/response'
import type {
  BuiltRouteHandler,
  RouteBuilderHandler,
  RouteHandler,
  RouterBuilderOptions,
  RouterOptions
} from '../types/router'
import type { MethodKeys } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { AnySchema, SchemaDynamic } from '../types/schema'
import { setRouteExtensions } from './extensionRegistry'
import type { Middleware } from './Middleware'
import { Router } from './Router'

/**
 * Scoped to a single HTTP method within a `RouterBuilder.method(key, ...)`
 * call - plugins' chain methods work identically here as on `Method` (same
 * `extend` primitive), but the accumulated `RequestExt` only ever
 * affects *this* method's handler, not sibling methods on the same router.
 */
export class RouteMethodBuilder<
  Responder extends Responders,
  const Path extends string,
  const MethodKey extends MethodKeys,
  const Schema extends SchemaDynamic<MethodKey>,
  const Context,
  const RequestExt extends Record<string, unknown> = {},
> {
  private readonly registrations: Record<string, unknown> = {}

  extend<E extends Record<string, unknown>>(
    _typeFragment: E,
    runtimeData?: Record<string, unknown>
  ): RouteMethodBuilder<Responder, Path, MethodKey, Schema, Context, RequestExt & E> {
    if (runtimeData) Object.assign(this.registrations, runtimeData)
    return this as unknown as RouteMethodBuilder<Responder, Path, MethodKey, Schema, Context, RequestExt & E>
  }

  handler<Handler extends RouteBuilderHandler<Path, Responder, MethodKey, Schema, Context, RequestExt>>(
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
 * `.build()` finalizes into a genuine `Router` instance (`instanceof Router`
 * holds), constructed through the real, unmodified constructor.
 */
export class RouterBuilder<
  Responder extends Responders,
  const Path extends string = string,
  const Schema extends SchemaDynamic<MethodKeys> = SchemaDynamic<MethodKeys>,
  const Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Routers extends Partial<Record<MethodKeys, unknown>> = {},
> {
  private readonly options: RouterBuilderOptions<Path, Schema, Middlewares>
  private readonly methodHandlers: Partial<Record<MethodKeys, unknown>> = {}
  private readonly perMethodRegistrations: Partial<Record<MethodKeys, Record<string, unknown>>> = {}

  constructor(options: RouterBuilderOptions<Path, Schema, Middlewares>) {
    this.options = options
  }

  method<
    MethodKey extends MethodKeys,
    Handler
  >(
    key: MethodKey,
    build: (builder: RouteMethodBuilder<Responder, Path, MethodKey, Schema, Context>) => BuiltRouteHandler<Handler>
  ): RouterBuilder<Responder, Path, Schema, Middlewares, Context, Routers & Record<MethodKey, Handler>> {
    const built = build(new RouteMethodBuilder())
    this.methodHandlers[key] = built.handler
    if (Object.keys(built.registrations).length > 0) this.perMethodRegistrations[key] = built.registrations

    return this as unknown as RouterBuilder<Responder, Path, Schema, Middlewares, Context, Routers & Record<MethodKey, Handler>>
  }

  build(): Router<Responder, Path, Schema, Middlewares, Context> & { methods: Routers } {
    // Same reasoning as `Method`'s constructor casting its own options: build
    // against the plain, unconstrained `RouteHandler` shape (what `Router`'s own constructor
    // naturally expects, and what its class-level constraint on `Routers`
    // requires), then describe the return type as an intersection instead
    // of parameterizing `Router`'s own `Routers` slot with our looser one.
    type UntypedRouters = { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> }

    const router = new Router({
      ...this.options,
      methods: this.methodHandlers
    } as unknown as RouterOptions<Path, Schema, Responder, Middlewares, Context, UntypedRouters>)

    setRouteExtensions(router, this.perMethodRegistrations)

    return router as unknown as Router<Responder, Path, Schema, Middlewares, Context> & { methods: Routers }
  }
}
