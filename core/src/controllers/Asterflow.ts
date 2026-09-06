import { adapters, Runtime, type Adapter, type AnyAdapter } from '@asterflow/adapter'
import type {
  AnyPluginInstance,
  AnyPlugins,
  InferConfigArgument,
  InferPluginExtension,
  Plugin,
  ResolvedPlugin
} from '@asterflow/plugin'
import type { Request } from '@asterflow/request'
import { AsterResponse, type Responders } from '@asterflow/response'
import {
  Method,
  MethodType,
  Router,
  type AnyMiddleware,
  type AnyMiddlewares,
  type AnyRouter,
  type AnySchema,
  type MethodCallProps,
  type MethodHandler,
  type MethodKeys,
  type MethodOptions,
  type Middleware,
  type MiddlewareOutput,
  type RouteHandler,
  type RouterCallProps,
  type RouterOptions,
  type SchemaDynamic
} from '@asterflow/router'
import { Analyze, ErrorLog, InternalExpression } from '@asterflow/url-parser'
import { Reminist } from 'reminist'
import type { AsterFlowOptions } from '../types/asterflow'
import type { MergedPluginContexts } from '../types/plugin'
import type { AnyReminist, DefaultReminist, InferReministContext } from '../types/reminist'
import type {
  BuildRouteContext,
  BuildRoutesContext,
  RouteEntry
} from '../types/routes'
import type { AnyRecord } from '../types/utils'
import { joinPaths } from '../utils/parser'

export class AsterFlowInstance<
  const Drive extends AnyAdapter = Adapter<Runtime.Node>,
  const Routers extends AnyReminist = DefaultReminist,
  const Plugins extends AnyPlugins = {},
  const Middlewares extends AnyMiddlewares = [],
  const Extension extends AnyRecord = {}
> {
  readonly driver: Drive
  readonly reminist: Routers = new Reminist({ keys: Object.keys(MethodType) }) as Routers
  readonly middlewares: Middlewares = [] as unknown as Middlewares
  
  plugins: Plugins = {} as Plugins
  private readonly onRequestPlugins: AnyPluginInstance[] = []
  private readonly onResponsePlugins: AnyPluginInstance[] = []
  private readonly beforeInitializePlugins: AnyPluginInstance[] = []
  private readonly afterInitializePlugins: AnyPluginInstance[] = []
  /** Merged view of every plugin's context, cached by `resolvePluginContexts()` at `listen()` time - see `runHandler`. */
  private pluginContext: MergedPluginContexts<Plugins> = {} as MergedPluginContexts<Plugins>


  constructor(options?: AsterFlowOptions<Drive>) {
    this.driver = (options?.driver ?? adapters.node) as Drive
    this.driver.onRequest = this.handleRequest.bind(this)
  }

  /**
   * Handles incoming requests, executing `onRequest` and `onResponse` plugin hooks.
   * Finds the matching route and executes its handler. Manages errors and "not found" responses.
   */
  private async handleRequest(request: Request<Drive['runtime']>, response: AsterResponse) {
    response = response ?? new AsterResponse()
    
    const notFound = () => response.notFound({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: `Unable to find route: ${request.getPathname()}`
    })

    const method = request.getMethod().toLowerCase() as MethodType | undefined
    if (!method) return notFound()

    const routeMatch = this.reminist.find(method, request.url.getPathname())
    if (!routeMatch?.node?.store) return notFound()

    const routeEntry = routeMatch.node.store as RouteEntry<string, AnyRouter>
    // Execute onRequest hooks - if any plugin returns a response, return it immediately
    const onRequestResult = await this.runHooks('onRequest', this as unknown as AnyAsterflow, routeEntry, request, response)
    if (onRequestResult) return onRequestResult


    // Parser /:id, [...slug] and [slug]
    if (
      routeEntry.url.ast.expressions.has(InternalExpression.Variable)
      || routeEntry.url.ast.expressions.has(InternalExpression.Dynamic)
      || routeEntry.url.ast.expressions.has(InternalExpression.DynamicCatchAll)
      || routeEntry.url.ast.expressions.has(InternalExpression.DynamicOptionalCatchAll)
      || routeEntry.url.ast.expressions.has(InternalExpression.Wildcard)
    ) {
      request.url = request.url.setParser(routeEntry.url as any)
    }
    
    try {
      await this.runHandler(routeEntry, request, response)
      await this.runHooks('onResponse', this as unknown as AnyAsterflow, routeEntry, request, response)

      return response
    } catch (err) {
      console.log(err)
      return response.badRequest({
        statusCode: 400,
        message: err instanceof ErrorLog ? 'AST_ERROR' : 'ERROR',
        error: err instanceof ErrorLog
          ? err.message
          : err instanceof Error
            ? err.message
            : err
      })
    }
  }
  
  /**
   * Adds a group of controllers with a common `basePath`.
   * Each route within the provided controllers will be prefixed with the `basePath`.
   */
  middleware<
    BasePath extends string,
    const Routes extends readonly AnyRouter[]
  >(options: { basePath: BasePath; controllers: Routes }) {
    for (const route of options.controllers) {
      const path = joinPaths(options.basePath, route.path)
      this.addEntry(route, path)
    }

    return this as unknown as AsterFlow<
      Drive,
      Reminist<
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? InferReministContext<Routers> & BuildRoutesContext<BasePath, Routes>
          : BuildRoutesContext<BasePath, Routes>,
        MethodKeys[]
      >,
      Plugins, Middlewares, Extension
    >
  }

  /**
   * Adds a single controller to AsterFlow.
   * The controller's path is normalized to be relative to the root.
   */
  controller<Route extends AnyRouter>(router: Route) {
    const path = joinPaths('/', router.path)
    this.addEntry(router, path)

    return this as unknown as AsterFlow<
      Drive,
      Reminist<
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? InferReministContext<Routers> & BuildRouteContext<Route>
          : BuildRouteContext<Route>,
        MethodKeys[]
      >,
      Plugins, Middlewares, Extension
    >
  }

  /**
   * Registers a plugin and its configuration with the AsterFlow instance.
   * Applies any instance extensions defined by the plugin.
   */
  use<Plug extends Plugin<any>>(
    plugin: Plug,
    config?: InferConfigArgument<Plug>
  ) {
    const pluginInstance = plugin.defineInstance(this as unknown as AnyAsterflow)
    const builtPlugin = pluginInstance._build(config);
    
    (this.plugins as Record<string, any>)[builtPlugin.name] = builtPlugin
    
    if (builtPlugin.hooks.onRequest) this.onRequestPlugins.push(builtPlugin)
    if (builtPlugin.hooks.onResponse) this.onResponsePlugins.push(builtPlugin)
    if (builtPlugin.hooks.beforeInitialize) this.beforeInitializePlugins.push(builtPlugin)
    if (builtPlugin.hooks.afterInitialize) this.afterInitializePlugins.push(builtPlugin)

    if (builtPlugin._extensionFn) {
      const extension = builtPlugin._extensionFn(this, builtPlugin.context)
      Object.assign(this, extension)
    }
    
    return this as AsterFlow<
      Drive,
      Routers,
      Plugins & { [K in Plug['name']]: ResolvedPlugin<Plug> },
      Middlewares,
      Extension & InferPluginExtension<Plug>
    >
  }

  /**
   * Creates and adds a new router to the AsterFlow instance.
   * A router can contain multiple method handlers for different HTTP verbs.
   */
  router<
  Responder extends Responders,
  const Path extends string = string,
  const Schema extends SchemaDynamic<MethodKeys> = SchemaDynamic<MethodKeys>,
  // Named `RouteMiddlewares` (not `Middlewares`) so it doesn't shadow the
  // class-level `Middlewares` generic - this one is this router's own `use`
  // list, unrelated to (and previously silently clobbering, via the shadow,
  // in this method's return type) the instance's actual `Middlewares`.
  const RouteMiddlewares extends readonly AnyMiddleware[] = [],
  const Context extends MiddlewareOutput<RouteMiddlewares> = MiddlewareOutput<RouteMiddlewares>,
  const Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, RouteMiddlewares, Context> } = { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, RouteMiddlewares, Context> },
  const Route extends Router<RouterCallProps<Responder, Path, Schema, RouteMiddlewares, Context, Routers>>
    = Router<RouterCallProps<Responder, Path, Schema, RouteMiddlewares, Context, Routers>>
  >(options: RouterOptions<RouterCallProps<Responder, Path, Schema, RouteMiddlewares, Context, Routers>>) {
    this.controller(new Router(options))

    return this as unknown as AsterFlow<
      Drive,
      Reminist<
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? InferReministContext<Routers> & BuildRouteContext<Route>
          : BuildRouteContext<Route>,
        MethodKeys[]
      >,
      Plugins, Middlewares, Extension
    >
  }

  /**
   * Creates and adds a new method handler (route) to the AsterFlow instance.
   * Defines a specific route for an HTTP method (GET, POST, etc.).
   */
  method<
    Responder extends Responders,
    const Path extends string = string,
    const Methoder extends MethodKeys = MethodKeys,
    const Schema extends AnySchema = AnySchema,
    // Named `RouteMiddlewares` (not `Middlewares`) so it doesn't shadow the
    // class-level `Middlewares` generic - this one is this route's own `use`
    // list, unrelated to (and previously silently clobbering, via the
    // shadow, in `Instance`'s bound and this method's return type) the
    // instance's actual `Middlewares`. Defaulted to `[]` (matching
    // `.router()`'s `RouteMiddlewares`) so a route declared without `use`
    // shows as `readonly []` instead of falling back to the wide constraint.
    const RouteMiddlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
    const Context extends MiddlewareOutput<RouteMiddlewares> = MiddlewareOutput<RouteMiddlewares>,
    // `Instance`/`Handler`/`Route` are always actually resolved by inferring
    // `Handler` from the real `options.handler` argument - these defaults
    // just restate their own constraints, only needed so `RouteMiddlewares`/
    // `Context` above are allowed to have defaults (TS requires every
    // subsequent type param to have one too, once one does).
    const Instance extends AsterFlowInstance<Drive, Routers, Plugins, Middlewares, Extension> & AnyAsterflow
      = AsterFlowInstance<Drive, Routers, Plugins, Middlewares, Extension> & AnyAsterflow,
    const Handler extends MethodHandler<Path, Drive['runtime'], Responder, Schema, RouteMiddlewares, Context, Instance>
      = MethodHandler<Path, Drive['runtime'], Responder, Schema, RouteMiddlewares, Context, Instance>,
    const Route extends Method<MethodCallProps<Responder, Path, Drive['runtime'], Methoder, Schema, RouteMiddlewares, Context, Instance, {}, Handler>>
      = Method<MethodCallProps<Responder, Path, Drive['runtime'], Methoder, Schema, RouteMiddlewares, Context, Instance, {}, Handler>>,
  >(options: MethodOptions<MethodCallProps<Responder, Path, Drive['runtime'], Methoder, Schema, RouteMiddlewares, Context, Instance, {}, Handler>>) {
    this.controller(new Method(options))

    return this as unknown as AsterFlow<
      Drive,
      Reminist<
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? InferReministContext<Routers> & BuildRouteContext<Route>
          : BuildRouteContext<Route>,
        MethodKeys[]
      >,
      Plugins, Middlewares, Extension
    >
  }

  /**
   * Itera sobre todos os plugins registrados e executa seus resolvers
   * de forma assíncrona, construindo o contexto de cada um.
   *
   * Also caches the merged view of every plugin's context into
   * `this.pluginContext` here, once, instead of re-merging it (via
   * `Object.values(...).reduce(...)`, an O(plugins) allocation) on every
   * single request in `runHandler` - plugin contexts are static after this
   * point.
   */
  private async resolvePluginContexts(): Promise<void> {
    for (const pluginName in this.plugins) {
      const plugin = this.plugins[pluginName]
      if (!plugin) continue

      if (plugin.resolvers) {
        for (const resolver of plugin.resolvers) {
          const newProps = await resolver(plugin.context, plugin.context)
          Object.assign(plugin.context, newProps)
        }
      }
    }

    this.pluginContext = Object.values(this.plugins).reduce((acc, plugin) => ({ ...acc, ...plugin.context }), {}) as MergedPluginContexts<Plugins>
  }

  /**
   * Starts the application server, triggering `beforeInitialize` and `afterInitialize` lifecycle hooks.
   */
  async listen(...args: Parameters<Drive['listen']>) {
    await this.resolvePluginContexts()
    await this.runHooks('beforeInitialize', this as unknown as AnyAsterflow)
    await this.driver.listen(...args as any)
    await this.runHooks('afterInitialize', this as unknown as AnyAsterflow)
  }

  /**
   * Adds a route entry to Reminist, associating it with specific HTTP methods.
   * Normalizes the route path and registers it for each supported method.
   */
  private addEntry(entry: AnyRouter, path: string): void {
    const methods = entry instanceof Method ? [entry.method] : Object.keys(entry.methods)
    const routeEntry: RouteEntry<string, AnyRouter> = { path, route: entry, methods, url: new Analyze(path) }

    for (const method of methods) {
      this.reminist.add(method as MethodKeys, path, routeEntry)
    }
  }

  /**
   * Executes the hook handlers for a specific hook name.
   * For onRequest hooks, returns the response if any plugin returns one (to stop execution flow).
   */
  private async runHooks(
    hookName: 'beforeInitialize' | 'afterInitialize' | 'onRequest' | 'onResponse',
    instance: AnyAsterflow,
    router?: RouteEntry<string, AnyRouter>,
    request?: Request<Drive['runtime']>,
    response?: AsterResponse
  ): Promise<AsterResponse | void> {
    const plugins = this[`${hookName}Plugins`]
    for (const plugin of plugins) {
      switch (hookName) {
      case 'beforeInitialize':
      case 'afterInitialize': {
        const handlers = plugin.hooks[hookName]
        if (!handlers) break
      
        for (const handler of handlers) {
          await handler(this, plugin.context)
        }
      }
        break
      case 'onRequest': {
        const handlers = plugin.hooks.onRequest
        if (!handlers) break
        if (!request || !response || !router) return

        for (const handler of handlers) {
          const result = await handler({ instance, router, request, response, plugin })
          // If handler returns a response, stop execution and return it
          if (result && typeof result === 'object' && result.constructor?.name === 'AsterResponse') {
            return result as AsterResponse
          }
        }
      }
        break
      case 'onResponse': {
        if (!request || !response || !router) return

        const handlers = plugin.hooks.onResponse
        if (handlers) {
          for (const handler of handlers) {
            await handler({ instance, router, request, response, plugin })
          }
        }
      }
        break
      }
    }
  }

  /**
   * Runs a route's `use` middleware chain in order, merging each
   * middleware's `next(params)` output into a single accumulated context
   * object. If a middleware returns an `AsterResponse` instead of calling
   * `next(...)` (e.g. `return response.unauthorized({...})`), the chain
   * stops immediately and that response is propagated back as final.
   */
  private async runMiddlewares(
    middlewares: AnyMiddlewares | undefined,
    request: Request<any>,
    response: AsterResponse,
    schema: unknown
  ): Promise<{ context: Record<string, unknown>, response?: AsterResponse }> {
    const context: Record<string, unknown> = {}
    if (!middlewares || middlewares.length === 0) return { context }

    // `next` and `args` are identical across every middleware in the chain -
    // built once outside the loop instead of re-allocating a closure/object
    // per middleware per request.
    const next = <Parameter extends Record<string, unknown>>(params: Parameter) => params
    const args = { request, response, schema, next }

    for (const middleware of middlewares) {
      const result = await middleware.onRun(args as any)

      if (result instanceof AsterResponse) return { context, response: result as AsterResponse }
      if (result && typeof result === 'object') Object.assign(context, result)
    }

    return { context }
  }

  /**
   * Executes a route handler, processing the request and response. Runs
   * `use` middlewares first (so an unauthorized/rejected request short-
   * circuits before paying for body validation), then schema validation if
   * present, then invokes the route handler.
   */
  private async runHandler({ route }: RouteEntry<string, AnyRouter>, request: Request<any>, response: AsterResponse) {
    const method = request.getMethod().toLowerCase() as MethodType
    const handler = route instanceof Method ? route.handler : route.methods[method]
    const schema = route instanceof Method ? route.schema : route.schema?.[method]

    if (!handler) return null
    const body = await request.getBody()

    const { context: middlewareContext, response: middlewareResponse } = await this.runMiddlewares(route.use, request, response, body)
    if (middlewareResponse) return middlewareResponse

    if (schema) {
      const schemaResult = schema.safeParse(body)
      if (!schemaResult.success) {
        return response.validationError({
          statusCode: 422,
          message: 'VALIDATION_ERROR',
          error: JSON.parse(schemaResult.error)
        })
      }
      response.send(schemaResult.data)
    }

    const context = {
      instance: this,
      request,
      response,
      url: request.url,
      schema: body,
      middleware: middlewareContext,
      // Computed once in `resolvePluginContexts()` at `listen()` time, not
      // per request - plugin contexts don't change after setup.
      plugins: this.pluginContext
    }

    return handler(context)
  }

}

export type AsterFlow<
  Drive extends AnyAdapter = AnyAdapter,
  Routers extends AnyReminist = DefaultReminist,
  Plugins extends AnyPlugins = AnyPlugins,
  Middlewares extends readonly AnyMiddleware[] = AnyMiddleware[],
  Extension extends Record<string, any> = Record<string, any>
> = AsterFlowInstance<Drive, Routers, Plugins, Middlewares, Extension> & Extension

export const AsterFlow: {
  new <Drive extends AnyAdapter = Adapter<Runtime.Node>>(
    options?: AsterFlowOptions<Drive>
  ): AsterFlow<Drive, DefaultReminist, {}, [], {}>
} = AsterFlowInstance

/**
 * Represents a generic AsterFlow instance, with all its types defined as `any`.
 * This allows flexibility when referencing AsterFlow without specifying all its type parameters.
 */
export type AnyAsterflow = AsterFlowInstance<AnyAdapter, AnyReminist, AnyPlugins, AnyMiddlewares, AnyRecord>