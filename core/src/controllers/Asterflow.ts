import { Driver, drivers, type Runtime } from '@asterflow/driver'
import { Reminist } from '@asterflow/reminist'
import {
  AsterRequest,
  Method,
  MethodType,
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
  Drive extends Driver<Runtime> = Driver<Runtime.Node>
>= {
  driver?: Drive
}

const byRouter = Reminist.create<AnyRouter>()

export class AsterFlow<
  const Routers extends Reminist<AnyRouter, MethodKeys[]> = Reminist<AnyRouter, MethodKeys[]>,
  const Drive extends Driver<Runtime> = Driver<Runtime.Node>,
> {
  readonly driver: Drive
  readonly reminist: Routers

  constructor (options: AsterFlowOptions<Drive>) {
    this.driver = options.driver ?? drivers.node as Drive
    this.reminist = byRouter({
      keys: Object.keys(MethodType) as MethodKeys[]
    }) as Routers
    this.setup()
  }

  private setup () {
    this.driver.onRequest = async (request, response) => {
      const asterquest = new AsterRequest(request)
      const notFound = response.notFound({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `Unable to find route: ${request.url}`
      })
    
      const method = asterquest.getRequest().method?.toLowerCase() as MethodType | undefined
      if (!method) return notFound
      
      const url = new URL(asterquest.getURL())
      const router = this.reminist.get(method, url.pathname)
      console.log(router)
      if (!router) return notFound

      switch (true) {
      case (router.store instanceof Router): {
        const func = router.store.methods[method] as RouteHandler<
          Responders,
          MethodKeys,
          SchemaDynamic<MethodKeys>,
          readonly AnyMiddleware[],
          MiddlewareOutput<readonly AnyMiddleware[]>> | undefined
        if (!func) return notFound
  
        return await func({ request: asterquest, response, schema: {}, middleware: {} })
      }
      case (router.store instanceof Method): {
        const res = await router.store.handler({ request: asterquest, response, schema: {}, middleware: {} })
  
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
        this.reminist.add(router.method as MethodKeys, router.path, router)
        continue
      }

      for (const method of Object.keys(router.methods)) {
        console.log(method, joinPaths(options.basePath, router.path))
        this.reminist.add(method as MethodKeys, joinPaths(options.basePath, router.path), router)
      }
    }

    return this
  }

  controller<Route extends AnyRouter>(router: Route) {
    switch (true) {
    case (router instanceof Router): {
      for (const method of Object.keys(router.methods) as MethodType[]) {
        this.reminist.add(method as MethodKeys, joinPaths('/', router.path), router)
      }
      break
    }
    case (router instanceof Method): {
      this.reminist.add(router.method as MethodKeys, joinPaths('/', router.path), router)
      break
    }
    }

    return this
  }
  get listen () {
    return this.driver.listen.bind(this.driver) as Drive['listen']
  }
}
