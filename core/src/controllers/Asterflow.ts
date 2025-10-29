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
  type MethodHandler,
  type MethodKeys,
  type MethodOptions,
  type Middleware,
  type MiddlewareOutput,
  type RouteHandler,
  type RouterOptions,
  type SchemaDynamic
} from '@asterflow/router'
import { Analyze, ErrorLog, InternalExpression, type NormalizePath } from '@asterflow/url-parser'
import { Reminist } from 'reminist'
import type { AsterFlowOptions } from '../types/asterflow'
import type { ExtractPaths, InferPath } from '../types/paths'
import type { MergedPluginContexts } from '../types/plugin'
import type { AnyReminist, InferReministContext, InferReministPath } from '../types/reminist'
import type {
  BuildRouteContext,
  BuildRoutesContext,
  RouteEntry
} from '../types/routes'
import type { AnyRecord } from '../types/utils'
import { joinPaths } from '../utils/parser'

export class AsterFlowInstance<
  const Drive extends AnyAdapter = Adapter<Runtime.Node>,
  const Routers extends AnyReminist = AnyReminist,
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
    const onRequestResult = await this.runHooks('onRequest', this, routeEntry, request, response)
    if (onRequestResult) return onRequestResult


    // Parser /:id, [...slug] and [slug]
    if (
      routeEntry.url.ast.expressions.has(InternalExpression.Variable) 
      || routeEntry.url.ast.expressions.has(InternalExpression.Slug)
    ) {
      request.url = request.url.withParser(routeEntry.url as any)
    }
    
    try {
      await this.runHandler(routeEntry, request, response)
      await this.runHooks('onResponse', this , routeEntry, request, response)

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
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, ...ExtractPaths<BasePath, Routes>]
          : ExtractPaths<BasePath, Routes>,
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
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
          : [NormalizePath<InferPath<Route>>],
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
  use<Plug extends Plugin<any, any, any, any, any, any>>(
    plugin: Plug,
    config?: InferConfigArgument<Plug>
  ) {
    const pluginInstance = plugin.defineInstance(this)
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
  const Middlewares extends readonly AnyMiddleware[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Routers extends { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> } = { [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context> },
  const Route extends Router<Responder, Path, Schema, Middlewares, Context, Routers> = Router<Responder, Path, Schema, Middlewares, Context, Routers>
  >(options: RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>) {
    this.controller(new Router(options))

    return this as unknown as AsterFlow<
      Drive,
      Reminist<
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
          : [NormalizePath<InferPath<Route>>],
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
    const Path extends string,
    const Methoder extends MethodKeys,
    const Schema extends AnySchema,
    const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
    const Context extends MiddlewareOutput<Middlewares>,
    const Instance extends AsterFlowInstance<Drive, Routers, Plugins, Middlewares, Extension>,
    const Handler extends MethodHandler<Path, Drive['runtime'], Responder, Schema, Middlewares, Context, Instance>,
    const Route extends Method<Responder, Path, Drive['runtime'], Methoder, Schema, Middlewares, Context, Instance, Handler>,
  >(options: MethodOptions<Responder, Path, Drive['runtime'], Methoder, Schema, Middlewares, Context, Instance, Handler>) {
    this.controller(new Method(options))

    return this as unknown as AsterFlow<
      Drive,
      Reminist<
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
          : [NormalizePath<InferPath<Route>>],
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
  }

  /**
   * Starts the application server, triggering `beforeInitialize` and `afterInitialize` lifecycle hooks.
   */
  async listen(...args: Parameters<Drive['listen']>) {
    await this.resolvePluginContexts()
    await this.runHooks('beforeInitialize', this)
    await this.driver.listen(...args as any)
    await this.runHooks('afterInitialize', this)
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
   * Executes a route handler, processing the request and response.
   * Performs schema validation, if present, and invokes the route handler.
   */
  private async runHandler({ route }: RouteEntry<string, AnyRouter>, request: Request<any>, response: AsterResponse) {
    const method = request.getMethod().toLowerCase() as MethodType
    const handler = route instanceof Method ? route.handler : route.methods[method]
    const schema = route instanceof Method ? route.schema : route.schema?.[method]
  
    if (!handler) return null
    if (schema) {
      const schemaResult = schema.safeParse(await request.getBody())
      if (!schemaResult.success) {
        return response.validationError({
          statusCode: 422,
          message: 'VALIDATION_ERROR',
          error: JSON.parse(schemaResult.error)
        })
      }
      response.send(schemaResult.data)
    }
  
    const pluginContext = Object.values(this.plugins).reduce((acc, plugin) => ({ ...acc, ...plugin.context }), {}) as MergedPluginContexts<Plugins>
    const context = {
      instance: this,
      request,
      response,
      url: request.url,
      schema: await request.getBody(),
      middleware: {},
      plugins: pluginContext
    }
  
    return handler(context)
  }

}

export type AsterFlow<
  Drive extends AnyAdapter = AnyAdapter,
  Routers extends AnyReminist = AnyReminist,
  Plugins extends AnyPlugins = AnyPlugins,
  Middlewares extends readonly AnyMiddleware[] = AnyMiddleware[],
  Extension extends Record<string, any> = Record<string, any>
> = AsterFlowInstance<Drive, Routers, Plugins, Middlewares, Extension> & Extension

export const AsterFlow: {
  new <Drive extends AnyAdapter = Adapter<Runtime.Node>>(
    options?: AsterFlowOptions<Drive>
  ): AsterFlow<Drive, AnyReminist, {}, [], {}>
} = AsterFlowInstance

/**
 * Represents a generic AsterFlow instance, with all its types defined as `any`.
 * This allows flexibility when referencing AsterFlow without specifying all its type parameters.
 */
export type AnyAsterflow = AsterFlowInstance<AnyAdapter, AnyReminist, AnyPlugins, AnyMiddlewares, AnyRecord>