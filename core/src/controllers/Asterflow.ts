/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Adapter, adapters, type Runtime } from '@asterflow/adapter'
import {
  type AnyPlugin,
  type AnyPluginHooks,
  type ConfigArgument,
  type ResolvedPlugin
} from '@asterflow/plugin'
import { Response } from '@asterflow/response'
import {
  Method,
  MethodType,
  Router,
  type AnyMiddleware,
  type AnyRouter,
  type MethodKeys
} from '@asterflow/router'
import { Reminist } from 'reminist'
import { Analyze, ErrorLog } from '@asterflow/url-parser'
import type { SafeParseReturnType } from 'zod'
import type { AsterFlowOptions } from '../types/asterflow'
import type { ExtractPaths, InferPath, NormalizePath } from '../types/paths'
import type { MergedPluginContexts } from '../types/plugin'
import type { InferReministContext, InferReministPath } from '../types/reminist'
import type {
  BuildRouteContext,
  BuildRoutesContext,
  RouteEntry
} from '../types/routes'
import type { Merge } from '../types/utils'
import { joinPaths } from '../utils/parser'

export class AsterFlow<
  const Routers extends Reminist<
    readonly string[],
    Record<string, RouteEntry<string, AnyRouter>>,
    MethodKeys[]
  >,
  const Plugins extends Record<string, ResolvedPlugin<AnyPlugin>> = {},
  const Middlewares extends readonly AnyMiddleware[] = [],
  const Drive extends Adapter<Runtime> = Adapter<Runtime.Node>
> {
  readonly driver: Drive
  readonly reminist: Routers = Reminist.create({ keys: Object.keys(MethodType) }).withData() as Routers
  
  plugins: Plugins = {} as Plugins
  private readonly onRequestPlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  private readonly onResponsePlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  private readonly beforeInitializePlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  private readonly afterInitializePlugins: (ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks })[] = []
  
  readonly middlewares: Middlewares = [] as unknown as Middlewares

  constructor(options: AsterFlowOptions<Drive>) {
    this.driver = (options.driver ?? adapters.node) as Drive
    this.setup()
  }

  private setup() {
    this.driver.onRequest = async (request, response = new Response()) => {
      for (const plugin of this.onRequestPlugins) {
        if (plugin.hooks.onRequest) {
          for (const handler of plugin.hooks.onRequest) {
            await handler(request, response, plugin.context)
          }
        }
      }

      const pluginContext = Object.values(this.plugins).reduce(
        (acc, plugin) => ({ ...acc, ...plugin.context }), {}) as MergedPluginContexts<Plugins>

      const notFound = response.notFound({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `Unable to find route: ${request.getPathname()}`
      })

      const method = request.getMethod().toLowerCase() as MethodType | undefined
      if (!method) return notFound

      const pathname = request.url.getPathname()
      const router = this.reminist.find(method, pathname)
      if (!router || !router.node?.store) return notFound

      const routeEntry = router.node.store as RouteEntry<string, AnyRouter>
      const actualRouter = routeEntry.route

      const url = request.url.withParser(actualRouter.url)

      const createHandlerContext = (schemaData: SafeParseReturnType<any, any>) => ({
        request,
        response,
        url,
        schema: schemaData,
        middleware: {},
        plugins: pluginContext
      })

      const process = async () => {
        try {
          if (actualRouter instanceof Router) {
            const func = actualRouter.methods[method]
            if (!func) return notFound

            const schema = actualRouter.schema?.[method]?.safeParse(request.getBody())
            if (schema !== undefined && !schema.success) {
              return response.validationError({
                statusCode: 422,
                message: 'VALIDATION_ERROR',
                error: schema.error
              })
            }

            return await func(createHandlerContext((schema as SafeParseReturnType<any, any>)?.data))
          }

          if (actualRouter instanceof Method) {
            const schema = actualRouter.schema?.safeParse(request.getBody())
            if (schema !== undefined && !schema.success) {
              return response.validationError({
                statusCode: 422,
                message: 'VALIDATION_ERROR',
                error: schema.error
              })
            }

            return await actualRouter.handler(createHandlerContext((schema as SafeParseReturnType<any, any>)?.data))
          }
        } catch (err) {
          if (err instanceof ErrorLog) {
            return response.badRequest({
              statusCode: 400,
              message: 'AST_ERROR',
              error: err.message
            })
          }

          return response.badRequest({
            statusCode: 400,
            message: 'ERROR',
            error: err
          })
        }
      }

      const responseData = await process()
      if (responseData) {
        for (const plugin of this.onResponsePlugins) {
          if (plugin.hooks.onRequest) {
            for (const handler of plugin.hooks.onRequest) {
              await handler(request, response, plugin.context)
            }
          }
        }

        return responseData
      }


      return notFound
    }
  }

  router<
    BasePath extends string,
    const Routes extends readonly AnyRouter[]
  >(options: { basePath: BasePath; controllers: Routes }) {
    for (const router of options.controllers) {
      const newURL = joinPaths(options.basePath, router.url.getPathname())
      router.url = new Analyze(newURL)

      const routeEntry: RouteEntry<string, AnyRouter> = {
        path: newURL,
        route: router,
        methods:
          router instanceof Method
            ? [router.method]
            : Object.keys(router.methods)
      }

      if (router instanceof Method) {
        this.reminist.add(router.method as MethodKeys, newURL, routeEntry)
        continue
      }

      for (const method of Object.keys(router.methods)) {
        this.reminist.add(method as MethodKeys, newURL, routeEntry)
      }
    }

    return this as unknown as AsterFlow<
      Reminist<
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, ...ExtractPaths<BasePath, Routes>]
          : ExtractPaths<BasePath, Routes>,
        InferReministContext<Routers> extends Record<
          string,
          RouteEntry<string, AnyRouter>
        >
          ? Merge<
              InferReministContext<Routers>,
              BuildRoutesContext<BasePath, Routes>
            >
          : BuildRoutesContext<BasePath, Routes>,
        MethodKeys[]
      >,
      Plugins,
      Middlewares,
      Drive
    >
  }

  controller<Route extends AnyRouter>(router: Route) {
    const path = joinPaths('/', router.url.getPathname())

    const routeEntry: RouteEntry<string, Route> = {
      path,
      route: router,
      methods:
        router instanceof Method
          ? [router.method]
          : (Object.keys(router.methods) as MethodKeys[])
    }

    if (router instanceof Method)
      this.reminist.add(router.method, path, routeEntry)
    else {
      for (const method of Object.keys(router.methods) as MethodType[]) {
        this.reminist.add(method, path, routeEntry)
      }
    }

    return this as unknown as AsterFlow<
      Reminist<
        InferReministPath<Routers> extends string[]
          ? [...InferReministPath<Routers>, NormalizePath<InferPath<Route>>]
          : [NormalizePath<InferPath<Route>>],
        InferReministContext<Routers> extends Record<
          string,
          RouteEntry<string, AnyRouter>
        >
          ? Merge<InferReministContext<Routers>, BuildRouteContext<Route>>
          : BuildRouteContext<Route>,
        MethodKeys[]
      >,
      Plugins,
      Middlewares,
      Drive
    >
  }

  /**
   * Registers a plugin and its configuration.
   */
  use<P extends AnyPlugin>(plugin: P, config: ConfigArgument<P>) {
    const instance = plugin._build(config) as ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks };

    (this.plugins as Record<string, any>)[instance.name] = instance

    if (instance.hooks.onRequest) this.onRequestPlugins.push(instance)
    if (instance.hooks.onResponse) this.onResponsePlugins.push(instance)
    if (instance.hooks.beforeInitialize) this.beforeInitializePlugins.push(instance)
    if (instance.hooks.afterInitialize) this.afterInitializePlugins.push(instance)

    return this as unknown as AsterFlow<
      Routers,
      Merge<Plugins, { [K in typeof instance.name]: typeof instance }>,
      Middlewares,
      Drive
    >
  }

  /**
   * Starts the application server, triggering lifecycle hooks.
   */
  public async listen(...args: Parameters<Drive['listen']>) {
    for (const plugin of this.beforeInitializePlugins) {
      if (plugin.hooks.beforeInitialize) {
        for (const handler of plugin.hooks.beforeInitialize) {
          await handler(this, plugin.context)
        }
      }
    }

    const server = await this.driver.listen(...args)

    for (const plugin of this.afterInitializePlugins) {
      if (plugin.hooks.afterInitialize) {
        for (const handler of plugin.hooks.afterInitialize) {
          await handler(this, plugin.context)
        }
      }
    }

    return server
  }
}
