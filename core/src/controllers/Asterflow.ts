import { adapters, type Adapter, type Runtime } from '@asterflow/adapter'
import type {
  AnyPlugin,
  AnyPluginHooks,
  AnyPlugins,
  ConfigArgument,
  InferPluginExtension,
  ResolvedPlugin
} from '@asterflow/plugin'
import type { Request } from '@asterflow/request'
import { Response, type Responders } from '@asterflow/response'
import {
  Method,
  MethodType,
  Router,
  type AnyMiddleware,
  type AnyRouter,
  type AnySchema,
  type MethodHandler,
  type MethodKeys,
  type MethodOptions,
  type Middleware,
  type MiddlewareOutput,
  type RouteHandler,
  type RouterOptions,
  type SchemaDynamic
} from '@asterflow/router'
import { Analyze, ErrorLog } from '@asterflow/url-parser'
import { Reminist } from 'reminist'
import type { AnyAsterflow, AsterFlowOptions } from '../types/asterflow'
import type { ExtractPaths, InferPath, NormalizePath } from '../types/paths'
import type { MergedPluginContexts } from '../types/plugin'
import type { AnyReminist, InferReministContext, InferReministPath } from '../types/reminist'
import type {
  BuildRouteContext,
  BuildRoutesContext,
  RouteEntry
} from '../types/routes'
import { joinPaths } from '../utils/parser'

class _AsterFlow<
  const Routers extends AnyReminist = AnyReminist,
  const Plugins extends Record<string, ResolvedPlugin<AnyPlugin>> = {},
  const Middlewares extends readonly AnyMiddleware[] = [],
  const Drive extends Adapter<Runtime> = Adapter<Runtime.Node>,
  const Extension extends Record<string, any> = {}
> implements IAsterflow<Routers, Plugins, Middlewares, Drive, Extension> {
  
  readonly driver: Drive
  readonly reminist: Routers = Reminist.create({ keys: Object.keys(MethodType) }).withData() as Routers
  
  plugins: Plugins = {} as Plugins
  private readonly onRequestPlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  private readonly onResponsePlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  private readonly beforeInitializePlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  private readonly afterInitializePlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  
  readonly middlewares: Middlewares = [] as unknown as Middlewares

  constructor(options?: AsterFlowOptions<Drive>) {
    this.driver = (options?.driver ?? adapters.node) as Drive
    this.driver.onRequest = (request, response) => this.handleRequest(request, response ?? new Response())
  }

  /**
   * Executes a route handler, processing the request and response.
   * Performs schema validation, if present, and invokes the route handler.
   * @param {RouteEntry<string, AnyRouter>} routeEntry - The route entry containing the route and additional information.
   * @param {Request<any>} request - The received request object.
   * @param {Response} response - The response object to be modified.
   * @returns {Promise<any | null>} The result of the route handler or `null` if no handler exists.
   */
  async executeHandler(routeEntry: RouteEntry<string, AnyRouter>, request: Request<any>, response: Response) {
    const { route } = routeEntry
    const method = request.getMethod().toLowerCase() as MethodType
  
    const handler = route instanceof Method ? route.handler : route.methods[method]
    const schema = route instanceof Method ? route.schema : route.schema?.[method]
  
    if (!handler) return null
  
    if (schema) {
      const schemaResult = schema.safeParse(request.getBody())
      if (!schemaResult.success) {
        return response.validationError({
          statusCode: 422,
          message: 'VALIDATION_ERROR',
          error: schemaResult.error
        })
      }
      response.send(schemaResult.data)
    }
  
    const pluginContext = Object.values(this.plugins).reduce((acc, plugin) => ({ ...acc, ...plugin.context }), {})
  
    const context = {
      instance: this,
      request,
      response,
      url: request.url,
      schema: request.getBody(),
      middleware: {},
      plugins: pluginContext as MergedPluginContexts<Plugins>
    }
  
    return handler(context)
  }

  /**
   * Handles incoming requests, executing `onRequest` and `onResponse` plugin hooks.
   * Finds the matching route and executes its handler. Manages errors and "not found" responses.
   * @param {Request<any>} request - The incoming request object.
   * @param {Response} response - The response object to be modified.
   * @returns {Promise<any>} The final processed response.
   */
  private async handleRequest(request: Request<any>, response: Response) {
    for (const plugin of this.onRequestPlugins) {
      for (const handler of plugin.hooks.onRequest!) {
        await handler(request, response, plugin.context)
      }
    }

    const notFoundResponse = () =>
      response.notFound({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `Unable to find route: ${request.getPathname()}`
      })

    const method = request.getMethod().toLowerCase() as MethodType | undefined
    if (!method) return notFoundResponse()

    const routeMatch = this.reminist.find(method, request.url.getPathname())
    if (!routeMatch?.node?.store) return notFoundResponse()

    const routeEntry = routeMatch.node.store as RouteEntry<string, AnyRouter>
    request.url = request.url.withParser(routeEntry.route.url) as any

    let responseData
    try {
      responseData = await this.executeHandler(routeEntry, request, response)
    } catch (err) {
      const errorPayload = {
        statusCode: 400,
        message: err instanceof ErrorLog ? 'AST_ERROR' : 'ERROR',
        error: err instanceof ErrorLog ? err.message : err
      }
      return response.badRequest(errorPayload)
    }

    if (responseData) {
      for (const plugin of this.onResponsePlugins) {
        for (const handler of plugin.hooks.onResponse!) {
          await handler(request, response, plugin.context)
        }
      }
      return responseData
    }

    return notFoundResponse()
  }
  
  /**
   * Adds a group of controllers with a common `basePath`.
   * Each route within the provided controllers will be prefixed with the `basePath`.
   * @template BasePath - The type of the base path string.
   * @template Routes - The type of the `AnyRouter` array.
   * @param {object} options - The options for the middleware.
   * @param {BasePath} options.basePath - The base path for the controllers.
   * @param {Routes} options.controllers - An array of controllers to be added.
   * @returns {AsterFlow<Reminist<any, any, any>, Plugins, Middlewares, Drive, Extension>} The current AsterFlow instance, with updated route types.
   */
  middleware<
    BasePath extends string,
    const Routes extends readonly AnyRouter[]
  >(options: { basePath: BasePath; controllers: Routes }) {
    for (const route of options.controllers) {
      const path = joinPaths(options.basePath, route.url.getPathname())
      this.addRouteEntry(route, path)
    }

    return this as unknown as AsterFlow<
      Reminist<
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, ...ExtractPaths<BasePath, Routes>]
          : ExtractPaths<BasePath, Routes>,
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? InferReministContext<Routers> & BuildRoutesContext<BasePath, Routes>
          : BuildRoutesContext<BasePath, Routes>,
        MethodKeys[]
      >,
      Plugins, Middlewares, Drive, Extension
    >
  }

  /**
   * Adds a single controller to AsterFlow.
   * The controller's path is normalized to be relative to the root.
   * @template Route - The type of the `AnyRouter` to be added.
   * @param {Route} router - The router object to be added.
   * @returns {AsterFlow<Reminist<any, any, any>, Plugins, Middlewares, Drive, Extension>} The current AsterFlow instance, with updated route types.
   */
  controller<Route extends AnyRouter>(router: Route) {
    const path = joinPaths('/', router.url.getPathname())
    this.addRouteEntry(router, path)

    return this as unknown as AsterFlow<
      Reminist<
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
          : [NormalizePath<InferPath<Route>>],
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? InferReministContext<Routers> & BuildRouteContext<Route>
          : BuildRouteContext<Route>,
        MethodKeys[]
      >,
      Plugins, Middlewares, Drive, Extension
    >
  }

  /**
   * Registers a plugin and its configuration with the AsterFlow instance.
   * Applies any instance extensions defined by the plugin.
   * @template P - The type of the plugin to be used.
   * @param {P} plugin - The plugin object to be registered.
   * @param {ConfigArgument<P>} config - The configuration for the plugin.
   * @returns {AsterFlow<Routers, Plugins & { [K in P['name']]: ResolvedPlugin<P> }, Middlewares, Drive, Extension & InferPluginExtension<P>>} The current AsterFlow instance, with updated plugin and extension types.
   */
  use<P extends AnyPlugin>(plugin: P, config: ConfigArgument<P>) {
    const pluginInstance = plugin.defineInstance(this)
    const builtPlugin = pluginInstance._build(config);
    
    (this.plugins as Record<string, any>)[builtPlugin.name] = builtPlugin as ResolvedPlugin<P>
    
    if (builtPlugin.hooks.onRequest) this.onRequestPlugins.push(builtPlugin)
    if (builtPlugin.hooks.onResponse) this.onResponsePlugins.push(builtPlugin)
    if (builtPlugin.hooks.beforeInitialize) this.beforeInitializePlugins.push(builtPlugin)
    if (builtPlugin.hooks.afterInitialize) this.afterInitializePlugins.push(builtPlugin)

    if (builtPlugin._extensionFn) {
      const extension = builtPlugin._extensionFn(this, builtPlugin.context)
      Object.assign(this, extension)
    }
    
    return this as unknown as AsterFlow<
      Routers,
      Plugins & { [K in P['name']]: ResolvedPlugin<P> },
      Middlewares,
      Drive,
      Extension & InferPluginExtension<P>
    >
  }

  /**
   * Creates and adds a new router to the AsterFlow instance.
   * A router can contain multiple method handlers for different HTTP verbs.
   * @template Responder - The type of available responders.
   * @template Path - The type of the route path string.
   * @template Schema - The type of the dynamic schema for methods.
   * @template Middlewares - The type of the array of middlewares.
   * @template Context - The type of the output context of the middlewares.
   * @template Routers - The type of the route handlers for methods.
   * @template Route - The type of the router instance.
   * @param {RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>} options - Options for configuring the router.
   * @returns {AsterFlow<Reminist<any, any, any>, Plugins, Middlewares, Drive, Extension>} The current AsterFlow instance, with updated route types.
   */
  router<
  Responder extends Responders,
  const Path extends string = string,
  const Schema extends SchemaDynamic<MethodKeys> = SchemaDynamic<MethodKeys>,
  const Middlewares extends readonly AnyMiddleware[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> } = { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> },
  const Route extends Router<Responder, Path, Schema, Middlewares, Context, Routers> = Router<Responder, Path, Schema, Middlewares, Context, Routers>
  >(options: RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>) {
    this.controller(new Router(options))
    return this as unknown as AsterFlow<
    Reminist<
      InferReministPath<Routers> extends string[]
        ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
        : [NormalizePath<InferPath<Route>>],
      InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
        ? InferReministContext<Routers> & BuildRouteContext<Route>
        : BuildRouteContext<Route>,
      MethodKeys[]
    >,
    Plugins, Middlewares, Drive, Extension
  >
  }

  /**
   * Creates and adds a new method handler (route) to the AsterFlow instance.
   * Defines a specific route for an HTTP method (GET, POST, etc.).
   * @template Responder - The type of available responders.
   * @template Path - The type of the route path string.
   * @template Methoder - The type of the HTTP method (e.g., 'GET', 'POST').
   * @template Schema - The type of the schema for the method.
   * @template Middlewares - The type of the array of middlewares for the method.
   * @template Context - The type of the output context of the middlewares.
   * @template Instance - The type of the AsterFlow instance.
   * @template Handler - The type of the route handler.
   * @template Route - The type of the method (route) instance.
   * @param {MethodOptions<Responder, Path, Methoder, Schema, Middlewares, Context, Instance, Handler>} options - Options for configuring the method.
   * @returns {AsterFlow<Reminist<any, any, any>, Plugins, Middlewares, Drive, Extension>} The current AsterFlow instance, with updated route types.
   */
  method<
    Responder extends Responders,
    const Path extends string,
    const Methoder extends MethodKeys,
    const Schema extends AnySchema,
    const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
    const Context extends MiddlewareOutput<Middlewares>,
    const Instance extends IAsterflow<Routers, Plugins, Middlewares, Drive, Extension>,
    const Handler extends MethodHandler<Path, Responder, Schema, Middlewares, Context, Instance>,
    const Route extends Method<Responder, Path, Methoder, Schema, Middlewares, Context, Instance, Handler>,
  >(options: MethodOptions<Responder, Path, Methoder, Schema, Middlewares, Context, Instance, Handler>) {
    this.controller(new Method(options))
    return this as unknown as AsterFlow<
    Reminist<
      InferReministPath<Routers> extends string[]
        ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
        : [NormalizePath<InferPath<Route>>],
      InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
        ? InferReministContext<Routers> & BuildRouteContext<Route>
        : BuildRouteContext<Route>,
      MethodKeys[]
    >,
    Plugins, Middlewares, Drive, Extension
  >
  }

  /**
   * Starts the application server, triggering `beforeInitialize` and `afterInitialize` lifecycle hooks.
   * @param {Parameters<Drive['listen']>} args - Arguments passed to the underlying driver's `listen` method.
   * @returns {Promise<any>} The started server.
   */
  async listen(...args: Parameters<Drive['listen']>) {
    await this.runHooks('beforeInitialize')
    const server = await this.driver.listen(...args)
    await this.runHooks('afterInitialize')
    return server
  }

  /**
   * Executes the hook handlers for a specific hook name.
   * @param {'beforeInitialize' | 'afterInitialize'} hookName - The name of the hook to be executed.
   * @returns {Promise<void>} A promise that resolves when all hook handlers have been executed.
   */
  private async runHooks(hookName: 'beforeInitialize' | 'afterInitialize') {
    const plugins = this[`${hookName}Plugins`]
    for (const plugin of plugins) {
      const handlers = plugin.hooks[hookName]
      if (handlers) {
        for (const handler of handlers) {
          await handler(this, plugin.context)
        }
      }
    }
  }

  /**
   * Adds a route entry to Reminist, associating it with specific HTTP methods.
   * Normalizes the route path and registers it for each supported method.
   * @param {AnyRouter} route - The router or method object to be added.
   * @param {string} path - The path of the route to be registered.
   * @returns {void}
   */
  private addRouteEntry(route: AnyRouter, path: string) {
    route.url = new Analyze(path)
    const methods = route instanceof Method ? [route.method] : Object.keys(route.methods)
    const routeEntry: RouteEntry<string, AnyRouter> = { path, route, methods }

    for (const method of methods) {
      this.reminist.add(method as MethodKeys, path, routeEntry)
    }
  }
}

interface IAsterflow<
  Routers extends AnyReminist,
  Plugins extends Record<string, ResolvedPlugin<AnyPlugin>>,
  Middlewares extends readonly AnyMiddleware[],
  Drive extends Adapter<Runtime>,
  Extension extends Record<string, any>
> {
  readonly driver: Drive
  reminist: Routers
  plugins: Plugins
  readonly middlewares: Middlewares

  middleware<BasePath extends string, const Routes extends readonly AnyRouter[]>(
    options: { basePath: BasePath; controllers: Routes }
  ): AsterFlow<
    Reminist<
      InferReministPath<Routers> extends string[]
        ? [...InferReministPath<Routers>, ...ExtractPaths<BasePath, Routes>]
        : ExtractPaths<BasePath, Routes>,
      InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
        ? InferReministContext<Routers> & BuildRoutesContext<BasePath, Routes>
        : BuildRoutesContext<BasePath, Routes>,
      MethodKeys[]
    >,
    Plugins, Middlewares, Drive, Extension
  >

  controller<Route extends AnyRouter>(
    router: Route
  ): AsterFlow<
    Reminist<
      InferReministPath<Routers> extends string[]
        ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
        : [NormalizePath<InferPath<Route>>],
      InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
        ? InferReministContext<Routers> & BuildRouteContext<Route>
        : BuildRouteContext<Route>,
      MethodKeys[]
    >,
    Plugins, Middlewares, Drive, Extension
  >

  use<P extends AnyPlugin>(
    plugin: P, config: ConfigArgument<P>
  ): AsterFlow<
    Routers,
    Plugins & { [K in P['name']]: ResolvedPlugin<P> },
    Middlewares,
    Drive,
    Extension & InferPluginExtension<P>
  >

  router<
  Responder extends Responders,
  const Path extends string = string,
  const Schema extends SchemaDynamic<MethodKeys> = SchemaDynamic<MethodKeys>,
  const Middlewares extends readonly AnyMiddleware[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> } = { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> },
  const Route extends Router<Responder, Path, Schema, Middlewares, Context, Routers> = Router<Responder, Path, Schema, Middlewares, Context, Routers>
  >(options: RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>): AsterFlow<
    Reminist<
      InferReministPath<Routers> extends string[]
        ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
        : [NormalizePath<InferPath<Route>>],
      InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
        ? InferReministContext<Routers> & BuildRouteContext<Route>
        : BuildRouteContext<Route>,
      MethodKeys[]
    >,
    Plugins, Middlewares, Drive, Extension
  >

  method<
    Responder extends Responders,
    const Path extends string,
    const Methoder extends MethodKeys,
    const Schema extends AnySchema,
    const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
    const Context extends MiddlewareOutput<Middlewares>,
    const Instance extends IAsterflow<Routers, Plugins, Middlewares, Drive, Extension>,
    const Handler extends MethodHandler<Path, Responder, Schema, Middlewares, Context, Instance>,
    const Route extends Method<Responder, Path, Methoder, Schema, Middlewares, Context, Instance, Handler>
  >(options: MethodOptions<Responder, Path, Methoder, Schema, Middlewares, Context, Instance, Handler>): AsterFlow<
    Reminist<
      InferReministPath<Routers> extends string[]
        ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
        : [NormalizePath<InferPath<Route>>],
      InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
        ? InferReministContext<Routers> & BuildRouteContext<Route>
        : BuildRouteContext<Route>,
      MethodKeys[]
    >,
    Plugins, Middlewares, Drive, Extension
  >

  listen(...args: Parameters<Drive['listen']>): Promise<any>
}

export type AsterFlow<
  Routers extends AnyReminist = AnyReminist,
  Plugins extends AnyPlugins = {},
  Middlewares extends readonly AnyMiddleware[] = [],
  Drive extends Adapter<Runtime> = Adapter<Runtime.Node>,
  Extension extends Record<string, any> = {}
> = IAsterflow<Routers, Plugins, Middlewares, Drive, Extension> & Extension

export const AsterFlow: {
  new <Drive extends Adapter<Runtime> = Adapter<Runtime.Node>>(
    options?: AsterFlowOptions<Drive>
  ): AsterFlow<AnyReminist, {}, [], Drive, {}>
} = _AsterFlow

export type ExtendedAsterflow<AF extends AnyAsterflow> =
  AF extends _AsterFlow<any, any, any, any, infer E>
    ? AF & E
    : AF