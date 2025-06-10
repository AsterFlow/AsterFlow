import { Adapter, adapters, type Runtime } from '@asterflow/adapter'
import {
  Method,
  MethodType,
  Response,
  Router,
  type AnyRouter,
  type MethodKeys
} from '@asterflow/router'
import { Reminist } from 'reminist'
import { Analyze, ErrorLog } from 'url-ast'
import type { SafeParseReturnType } from 'zod'
import { joinPaths } from '../utils/parser'

type AsterFlowOptions<
  Drive extends Adapter<Runtime> = Adapter<Runtime.Node>
>= {
  driver?: Drive
}

export class AsterFlow<
  const Routers extends Reminist<AnyRouter, MethodKeys[]> = Reminist<AnyRouter, MethodKeys[]>,
  const Drive extends Adapter<Runtime> = Adapter<Runtime.Node>,
> {
  readonly driver: Drive
  readonly reminist: Routers

  constructor (options: AsterFlowOptions<Drive>) {
    this.driver = options.driver ?? adapters.node as Drive
    this.reminist = Reminist.create({ keys: Object.keys(MethodType) as MethodKeys[] }).withData<AnyRouter>() as Routers
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
      
      const url = request.url.withParser(router.node.store.url)
      if (router.node.store instanceof Router) {
        const func = router.node.store.methods[method]
        if (!func) return notFound

        const schema = router.node.store.schema?.[method]?.safeParse(request.getBody())
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
        if (router.node.store instanceof Method) {
          const schema = router.node.store.schema?.safeParse(request.getBody())
          if (schema !== undefined && !schema.success) {
            return response.zodError({
              statusCode: 422,
              message: 'ZOD_ERROR',
              error: schema.error
            })
          }

          return await router.node.store.handler({
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

      if (router instanceof Method) {
        this.reminist.add(router.method as MethodKeys, newURL, router)
        continue
      }

      for (const method of Object.keys(router.methods)) {
        this.reminist.add(method as MethodKeys, newURL, router)
      }
    }

    return this
  }

  controller<Route extends AnyRouter>(router: Route) {
    const path = joinPaths('/', router.url.getPathname())

    if (router instanceof Method) this.reminist.add(router.method, path, router)
    else {
      for (const method of Object.keys(router.methods) as MethodType[]) {
        this.reminist.add(method, path, router)
      }
    }
      
    return this
  }

  get listen () {
    return this.driver.listen.bind(this.driver) as Drive['listen']
  }
}
