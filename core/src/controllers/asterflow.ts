import type { Driver, Runtime } from "driver";
import type {
  Method,
  MethodKeys,
  Responders,
  RouteHandler,
  Router,
  SchemaDynamic
} from "router";

type Tuple<T extends readonly any[]> = readonly [...T];

export function createRouters<
  Path extends Tuple<string[]>,
  Method extends Tuple<MethodKeys[]>,
  Schema extends Tuple<SchemaDynamic<Method[number]>[]>,
  Responder extends Tuple<Responders[]>,
  const Routers extends Tuple<Router<
    Path[number],
    Method[number],
    Schema[number],
    Responder[number],
    {
      [Method in MethodKeys]?: RouteHandler<Responder[number], MethodKeys, Schema[number]>
    }>[]>
>(routes: Routers): Routers {
  return routes;
}

export function createRouter<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Controllers extends { [Method in MethodKeys]?: RouteHandler<Responders, Method, Schema> },
  const Routers extends Router<Path, any, any, any, Controllers>
>(routes: Routers): Routers {
  return routes;
}

type MapRouters<
  BasePath extends string,
  Routers extends Tuple<(Router<any, any, any, any, any> | Method<any, any, any, any>)[]>> = {
  [K in BasePath]: Routers;
};

type MapController<Route> = Route extends Router<infer RouterPath, any, any, any, any> | Method<infer RouterPath, any, any, any>
  ? { [K in RouterPath]: Route }
  : never;

export class AsterFlow<
  Responder extends Responders,
  Drive extends Driver<Runtime>,
  const BasePaths extends object = {},
> {
  readonly driver: Drive

  constructor ({ driver }: { driver: Drive }) {
    this.driver = driver
  }

  router<
    BasePath extends string,
    RPath extends Tuple<string[]>,
    RMethods extends Tuple<MethodKeys[]>,
    RSchema extends Tuple<SchemaDynamic<RMethods[number]>[]>,
    RControllers extends Tuple<{ [Method in MethodKeys]?: RouteHandler<Responder, RMethods[number], any> }[]>,
    const Routers extends Tuple<
      (Router<RPath[number], RMethods[number], RSchema[number], Responder, RControllers[number]> | Method<any, any, any, any>)[]
    >
  >({ basePath, controllers }: {
    basePath: BasePath;
    controllers: Routers;
  }) {
    return this as AsterFlow<Responder, Drive, BasePaths & MapRouters<BasePath, Routers>>
  }

  controller<
    Path extends string,
    Methods extends MethodKeys,
    Schema extends SchemaDynamic<Methods>,
    Controllers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, any> },
    Routers extends Router<Path, Methods, Schema, Responder, Controllers> | Method<any, any, any, any>
  >(router: Routers) {
    return this as AsterFlow<Responder, Drive, BasePaths & MapController<Routers>
    >;
  }

  get listen () {
    return this.driver.listen.bind(this.driver) as Drive['listen']
  }
}
