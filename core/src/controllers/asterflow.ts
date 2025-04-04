import { fastify, type FastifyInstance } from "fastify";
import type {
  MethodKeys,
  Responders,
  RouteHandler,
  SchemaDynamic,
  TReply,
  Router
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

type MapRouters<BasePath extends string, Routers extends Tuple<Router<any, any, any, any, any>[]>> = {
  [K in BasePath]: Routers;
};

type MapController<Route> = Route extends Router<infer RouterPath, any, any, any, any>
  ? { [K in RouterPath]: Route }
  : never;

export class AsterFlow<
  Responder extends Responders = TReply<unknown>,
  const BasePaths extends object = {}
> {
  readonly instance: FastifyInstance

  constructor () {
    this.instance = fastify()
  }

  router<
    BasePath extends string,
    Path extends Tuple<string[]>,
    Methods extends Tuple<MethodKeys[]>,
    Schema extends Tuple<SchemaDynamic<Methods[number]>[]>,
    Controllers extends Tuple<{ [Method in MethodKeys]?: RouteHandler<Responder, Methods[number], any> }[]>,
    const Routers extends Tuple<Router<Path[number], Methods[number], Schema[number], Responder, Controllers[number]>[]>
  >({ basePath, controllers }: {
    basePath: BasePath;
    controllers: Routers;
  }) {
    return this as AsterFlow<Responder, BasePaths & MapRouters<BasePath, Routers>>
  }

  controller<
    Path extends string,
    Methods extends MethodKeys,
    Schema extends SchemaDynamic<Methods>,
    Controllers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, any> },
    Routers extends Router<Path, Methods, Schema, Responder, Controllers>
  >(router: Routers) {
    return this as AsterFlow<Responder, BasePaths & MapController<Routers>
    >;
  }

  get listen () {
    return this.instance.listen.bind(this.instance)
  }
}
