import { Adapter, adapters, type Runtime } from '@asterflow/adapter'
import { Reminist } from 'reminist'
import {
  Method,
  MethodType,
  Response,
  Router,
  type AnyMiddleware,
  type AnyRouter,
  type MethodKeys,
  type MiddlewareOutput,
  type Responders,
  type RouteHandler,
  type SchemaDynamic,
} from '@asterflow/router'
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

      switch (true) {
      case (router.node.store instanceof Router): {
        const func = router.node.store.methods[method] as RouteHandler<
          string,
          Responders,
          MethodKeys,
          SchemaDynamic<MethodKeys>,
          readonly AnyMiddleware[],
          MiddlewareOutput<readonly AnyMiddleware[]>> | undefined
        if (!func) return notFound
  
        return await func({ request, response, url: request.url.withParser(router.node.store.url), schema: {}, middleware: {} })
      }
      case (router.node.store instanceof Method): {
        const res = await router.node.store.handler({ request, response, url: request.url.withParser(router.node.store.url), schema: {}, middleware: {} })
  
        return res
      }
      default: return notFound
      }
    }
  }

  router<
    BasePath extends string,
    const Routes extends readonly AnyRouter[]
  >(options: { basePath: BasePath; controllers: Routes }) {
    for (const router of options.controllers) {
      if (router instanceof Method) {
        this.reminist.add(router.method as MethodKeys, router.url.getPathname(), router)
        continue
      }

      for (const method of Object.keys(router.methods)) {
        console.log(method, joinPaths(options.basePath, router.url.getPathname()))
        this.reminist.add(method as MethodKeys, joinPaths(options.basePath, router.url.getPathname()), router)
      }
    }

    return this
  }

  controller<Route extends AnyRouter>(router: Route) {
    switch (true) {
    case (router instanceof Router): {
      for (const method of Object.keys(router.methods) as MethodType[]) {
        this.reminist.add(method as MethodKeys, joinPaths('/', router.url.getPathname()), router)
      }
      break
    }
    case (router instanceof Method): {
      this.reminist.add(router.method as MethodKeys, joinPaths('/', router.url.getPathname()), router)
      break
    }
    }

    return this
  }
  get listen () {
    return this.driver.listen.bind(this.driver) as Drive['listen']
  }
}
