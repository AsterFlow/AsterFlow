import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from 'asterflow'
import type { Responders } from '@asterflow/response'
import type {
  AnySchema,
  MethodHandler, MethodKeys,
  Middleware,
  MiddlewareOutput,
  MethodOptions,
  RouterOptions,
  RouteHandler,
  SchemaDynamic
} from '@asterflow/router'

// FS plugin augmentation: core router now supports optional path/param directly,
// this module augmentation is kept for backward compatibility and type helpers.
declare module '@asterflow/router' {
  type MethodOptionsFS<
   Responder extends Responders,
   Path extends string = string,
   Drive extends Runtime = Runtime,
   Method extends MethodKeys = MethodKeys,
   Schema extends AnySchema = AnySchema,
   Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
   Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
   Instance extends AnyAsterflow = AnyAsterflow,
   Handler extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance> = MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance>,
  > = Omit<MethodOptions<Responder, Path, Drive, Method, Schema, Middlewares, Context, Instance, Handler>, 'path'> 
    & {
      path?: Path
      param?: Path
    }

  type RouterOptionsFS<
    Path extends string,
    Schema extends SchemaDynamic<MethodKeys>,
    Responder extends Responders,
    Middlewares extends readonly Middleware<Responder, AnySchema, string, Record<string, unknown>>[],
    Context extends MiddlewareOutput<Middlewares>,
    Routers extends {
      [Method in MethodKeys]?: RouteHandler<Path, Responder, Method, Schema, Middlewares, Context>;
    }
  > = Omit<RouterOptions<Path, Schema, Responder, Middlewares, Context, Routers>, 'path'> 
    & {
      path?: Path
      param?: Path
    }
}
