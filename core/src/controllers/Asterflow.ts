import { Driver, type Runtime } from "driver";
import {
  AsterRequest,
  Router,
  type Method,
  type MethodKeys,
  type Responders,
  type RouteHandler,
  type SchemaDynamic} from "router";
import type { CombinedRoutes, InferPath, Tuple, UnionToIntersection } from "../types/asterflow";
import { joinPaths } from "../utils/parser";

function listAllMethods(obj: any): string[] {
  const methods = new Set<string>();

  let current = obj;

  while (current && current !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(current)) {
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (
        descriptor &&
        typeof descriptor.value === 'function' &&
        key !== 'constructor' &&
        !key.startsWith('#') // Ignora métodos "privados" por convenção
      ) {
        methods.add(key);
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return [...methods];
}



type RoutersType = Map<string, Router<any, any, any, any, any> | Method<any, any, any, any, any>>

export class AsterFlow<
  Responder extends Responders,
  const RouterMap,
  Drive extends Driver<Runtime> = Driver<Runtime>,
> {
  readonly driver: Drive
  readonly routers: RouterMap = new Map<string, RoutersType>() as RouterMap;

  constructor ({ driver }: { driver: Drive }) {
    this.driver = driver
    this.setup()
  }

  private setup () {
    this.driver.onRequest = async (request, response) => {
      const asterquest = new AsterRequest(request)

      // for (const key of listAllMethods(asterquest)) {
      //   console.log(key, await asterquest[key]())
      // }
 
      const url = new URL(asterquest.getURL())
      const router = (this.routers as RoutersType).get(url.pathname)
      const notFound = response.notFound({
        statusCode: 404,
        error: "Not Found",
        message: `Unable to find route: ${request.url}`
      })
      if (!router) return notFound

      if (router instanceof Router) {
        const method = router.methods[asterquest.request.method?.toLowerCase() ?? 'get'] as RouteHandler<Responders, MethodKeys, SchemaDynamic<MethodKeys>> | undefined
        if (!method) return notFound

        return await method({ request: asterquest, response, schema: {} })
      } else {
        return await router.handler({ request: asterquest, response, schema: {} })
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
