import { Driver, type Runtime } from '@asterflow/driver'
import {
  AsterRequest,
  Method,
  Router,
  type MethodKeys,
  type Responders,
  type RouteHandler,
  type SchemaDynamic
} from '@asterflow/router'
import type { CombinedRoutes, InferPath, Tuple, UnionToIntersection } from '../types/asterflow'
import { joinPaths } from '../utils/parser'

type RoutersType = Map<string, Router<any, any, any, any, any> | Method<any, any, any, any, any>>

export class AsterFlow<
  Responder extends Responders,
  const RouterMap,
  Drive extends Driver<Runtime> = Driver<Runtime>,
> {
  readonly driver: Drive
  readonly routers: RouterMap = new Map<string, RoutersType>() as RouterMap

  constructor ({ driver }: { driver: Drive }) {
    this.driver = driver
    this.setup()
  }

  private setup () {
    this.driver.onRequest = async (request, response) => {
      const asterquest = new AsterRequest(request)
      
      const url = new URL(asterquest.getURL())
      const router = (this.routers as RoutersType).get(url.pathname)
      const notFound = response.notFound({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `Unable to find route: ${request.url}`
      })

      switch (true) {
      case (router instanceof Router): {
        const method = router.methods[asterquest.getRequest().method?.toLowerCase() ?? 'get'] as RouteHandler<Responders, MethodKeys, SchemaDynamic<MethodKeys>> | undefined
        if (!method) return notFound
  
        return await method({ request: asterquest, response, schema: {} })
      }
      case (router instanceof Method): {
        const method = router.method === asterquest.getRequest().method?.toLowerCase()
        if (!method) return notFound

        const res = await router.handler({ request: asterquest, response, schema: {} })
  
        return res
      }
      default: return notFound
      }
    }
  }

  router<
    BasePath extends string,
    const Routes extends (Router<any, any, any, Responder, any> | Method<Responder, any, any, any, any>)[]
  >({ basePath, controllers }: { basePath: BasePath; controllers: Tuple<Routes> }) {
    for (const router of controllers) {
      (this.routers as RoutersType).set(joinPaths(basePath, router.path), router)
    }

    return this as AsterFlow<
      Responder,
      RouterMap & UnionToIntersection<CombinedRoutes<BasePath, Routes>>,
      Drive
    >
  }

  controller<Route extends Router<any, any, any, Responder, any> | Method<Responder, any, any, any, any>>(
    router: Route
  ) {
    (this.routers as RoutersType).set(joinPaths('/', router.path), router)
    return this as AsterFlow<Responder, RouterMap & Map<InferPath<Route>, Route>, Drive>
  }
  get listen () {
    return this.driver.listen.bind(this.driver) as Drive['listen']
  }
}
