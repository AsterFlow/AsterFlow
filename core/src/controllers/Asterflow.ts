import { Adapter, adapters, type Runtime } from '@asterflow/adapter'
import { Response } from '@asterflow/response'
import {
  Method,
  MethodType,
  Router,
  type AnyRouter,
  type MethodKeys
} from '@asterflow/router'
import { Reminist } from 'reminist'
import { Analyze, ErrorLog } from 'url-ast'
import type { SafeParseReturnType } from 'zod'
import type {
  BuildRouteContext,
  BuildRoutesContext,
  ExtractPaths,
  InferPath,
  InferReministContext,
  InferReministPath,
  MergeContexts,
  NormalizePath,
  RouteEntry
} from '../types/asterflow'
import { joinPaths } from '../utils/parser'

type AsterFlowOptions<
  Drive extends Adapter<Runtime> = Adapter<Runtime.Node>
>= {
  driver?: Drive
}

export class AsterFlow<
  const Routers extends Reminist<readonly string[], Record<string, RouteEntry<string, AnyRouter>>, MethodKeys[]>,
  const Drive extends Adapter<Runtime> = Adapter<Runtime.Node>,
> {
  readonly driver: Drive
  readonly reminist: Routers

  constructor (options: AsterFlowOptions<Drive>) {
    this.driver = options.driver ?? adapters.node as Drive
    this.reminist = Reminist.create({ keys: Object.keys(MethodType) as MethodKeys[] }).withData() as unknown as Routers
    this.setup()
  }

  private setup () {
    this.driver.onRequest = async (request, response = new Response()) => {
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
      if (actualRouter instanceof Router) {
        const func = actualRouter.methods[method]
        if (!func) return notFound

        const schema = actualRouter.schema?.[method]?.safeParse(request.getBody())
        if (schema !== undefined && !schema.success) {
          return response.zodError({
            statusCode: 422,
            message: 'ZOD_ERROR',
            error: schema.error
          })
        }
  
        return await func({
          request,
          response,
          url,
          schema: (schema as SafeParseReturnType<any, any>)?.data,
          middleware: {}
        })
      }
      
      try {
        if (actualRouter instanceof Method) {
          const schema = actualRouter.schema?.safeParse(request.getBody())
          if (schema !== undefined && !schema.success) {
            return response.zodError({
              statusCode: 422,
              message: 'ZOD_ERROR',
              error: schema.error
            })
          }

          return await actualRouter.handler({
            request,
            response,
            url,
            schema: (schema as SafeParseReturnType<any, any>)?.data,
            middleware: {}
          })
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
        methods: router instanceof Method 
          ? [router.method] as readonly [typeof router.method]
          : Object.keys(router.methods) as readonly (keyof typeof router.methods)[]
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
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? MergeContexts<InferReministContext<Routers>, BuildRoutesContext<BasePath, Routes>>
          : BuildRoutesContext<BasePath, Routes>,
        MethodKeys[]
      >,
      Drive
    >
  }

  controller<Route extends AnyRouter>(router: Route) {
    const path = joinPaths('/', router.url.getPathname())

    const routeEntry: RouteEntry<string, Route> = {
      path,
      route: router,
      methods: router instanceof Method
        ? [router.method]
        : Object.keys(router.methods) as MethodKeys[]
    }

    if (router instanceof Method) this.reminist.add(router.method, path, routeEntry)
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
        InferReministContext<Routers> extends Record<string, RouteEntry<string, AnyRouter>>
          ? MergeContexts<InferReministContext<Routers>, BuildRouteContext<Route>>
          : BuildRouteContext<Route>,
        MethodKeys[]
      >, 
      Drive
    >
  }

  get listen () {
    return this.driver.listen.bind(this.driver) as Drive['listen']
  }
}
