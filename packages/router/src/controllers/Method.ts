import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from 'asterflow'
import type { Responders } from '@asterflow/response'
import type { MethodBuilderOptions, MethodHandler, MethodKeys, MethodOptions } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { AnySchema } from '../types/schema'
import type { Middleware } from './Middleware'

/**
 * `handler`'s field type: a concrete `MethodHandler<...>` once finished, or
 * - while `Handler` is `undefined` (pending) - the terminal chain call
 * itself, `<H extends MethodHandler<...>>(fn: H) => Method<..., H>`.
 */
export type MethodHandlerSlot<
  Path extends string,
  Drive extends Runtime,
  Responder extends Responders,
  MethodKey extends MethodKeys,
  Schema extends AnySchema,
  Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[],
  Context extends MiddlewareOutput<Middlewares>,
  Instance extends AnyAsterflow,
  RequestExt extends Record<string, unknown>,
  Handler extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, RequestExt> | undefined
> = Handler extends undefined
  ? <H extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, RequestExt>>(
      fn: H
    ) => Method<Responder, Path, Drive, MethodKey, Schema, Middlewares, Context, Instance, RequestExt, H>
  : Handler

export class Method<
  Responder extends Responders,
  const Path extends string = string,
  const Drive extends Runtime = Runtime,
  const MethodKey extends MethodKeys = MethodKeys,
  const Schema extends AnySchema = AnySchema,
  const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
  const Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
  const Instance extends AnyAsterflow = AnyAsterflow,
  const RequestExt extends Record<string, unknown> = {},
  const Handler extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, RequestExt> | undefined
    = MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, RequestExt>,
>{
  path: Path
  param?: Path
  method: MethodKey
  schema?: Schema

  name?: string
  use?: Middlewares

  /**
   * While pending (`Handler` is `undefined`), this field's runtime value is
   * a self-replacing closure: calling it with the real handler assigns that
   * function back onto `handler` and returns `this`. Lexically bound to
   * `this`, so it still works detached from `route` (as `Asterflow`'s
   * `runHandler` does). Throws if called with anything but a function.
   */
  handler: MethodHandlerSlot<Path, Drive, Responder, MethodKey, Schema, Middlewares, Context, Instance, RequestExt, Handler>

  /** Plugin registrations from `extend` (e.g. multipart's `.multipart(schema)`), read back via `route.extensions.multipart`. */
  readonly extensions: Record<string, unknown> = {}

  constructor (options: MethodOptions<Responder, Path, Drive, MethodKey, Schema, Middlewares, Context, Instance, MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance>>) {
    this.path = (options.path ?? options.param) as Path
    this.method = options.method
    this.schema = options.schema
    this.use = options.use

    // `options.handler` is `undefined` only from `Method.create(...)` below (cast past the type checker there).
    this.handler = (options.handler ?? ((fn: unknown) => {
      if (typeof fn !== 'function') {
        throw new TypeError('This route was built with Method.create(...) but never finished with a terminal .handler(...) call before being used.')
      }
      (this as unknown as { handler: unknown }).handler = fn
      return this
    })) as unknown as MethodHandlerSlot<Path, Drive, Responder, MethodKey, Schema, Middlewares, Context, Instance, RequestExt, Handler>
  }

  /**
   * Defers `handler` to a terminal `.handler(fn)` call so plugins can chain
   * `request` extensions first, e.g.
   * `Method.create({...}).multipart({...}).handler(...)`. Returns a real
   * `Method`, not a separate class.
   *
   * Static, not folded into the constructor: a constructor shares one set
   * of type-parameter defaults, and the default that infers an eager inline
   * handler's parameters isn't the one that correctly types a pending
   * route's `handler` field - verified empirically. Only a method can give
   * each its own.
   *
   * Plugins add their own chain method via `declare module '@asterflow/router'
   * { interface Method<...> { theirMethod(...): Method<...> } }` plus a real
   * `Method.prototype.theirMethod = ...` implementation calling `extend`.
   */
  static create<
    Responder extends Responders,
    const Path extends string = string,
    const Drive extends Runtime = Runtime,
    const MethodKey extends MethodKeys = MethodKeys,
    const Schema extends AnySchema = AnySchema,
    const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
  >(
    options: MethodBuilderOptions<Path, MethodKey, Schema, Middlewares>
  ): Method<Responder, Path, Drive, MethodKey, Schema, Middlewares, MiddlewareOutput<Middlewares>, AnyAsterflow, {}, undefined> {
    return new Method({
      ...options,
      handler: undefined
    } as unknown as MethodOptions<Responder, Path, Drive, MethodKey, Schema, Middlewares, MiddlewareOutput<Middlewares>, AnyAsterflow, MethodHandler<Path, Drive, Responder, Schema, Middlewares, MiddlewareOutput<Middlewares>, AnyAsterflow>>)
  }

  /**
   * Primitive every plugin's chain method calls. `typeFragment` only drives
   * inference of `E`, never read at runtime; `runtimeData` merges into
   * `this.extensions`. Meaningful only pre-`.handler(fn)` - calling it after
   * loses precise `Handler` typing (`any`) rather than fighting the bound.
   */
  extend<E extends Record<string, unknown>>(
    _typeFragment: E,
    runtimeData?: Record<string, unknown>
  ): Method<Responder, Path, Drive, MethodKey, Schema, Middlewares, Context, Instance, RequestExt & E, Handler extends undefined ? undefined : any> {
    if (runtimeData) Object.assign(this.extensions, runtimeData)
    return this as unknown as Method<Responder, Path, Drive, MethodKey, Schema, Middlewares, Context, Instance, RequestExt & E, Handler extends undefined ? undefined : any>
  }
}
