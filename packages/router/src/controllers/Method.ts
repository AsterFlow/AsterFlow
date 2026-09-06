import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from 'asterflow'
import type { Responders } from '@asterflow/response'
import type { DefaultMethodProps, MethodBuilderOptions, MethodCallProps, MethodConstructorOptions, MethodHandler, MethodKeys, MethodProps } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { AnySchema } from '../types/schema'
import type { MergeProps } from '../types/utils'
import type { Middleware } from './Middleware'

export interface MethodConstructor {
  new <
    Responder extends Responders,
    const Path extends string = string,
    const Drive extends Runtime = Runtime,
    const MethodKey extends MethodKeys = MethodKeys,
    const Schema extends AnySchema = AnySchema,
    const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
    const Context = MiddlewareOutput<Middlewares>,
    const Instance extends AnyAsterflow = AnyAsterflow,
    const Handler extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, {}> = MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, {}>,
  >(
    method: MethodKey,
    options: MethodConstructorOptions<MethodCallProps<Responder, Path, Drive, MethodKey, Schema, Middlewares, Context, Instance, {}, Handler>>
  ): Method<MethodCallProps<Responder, Path, Drive, MethodKey, Schema, Middlewares, Context, Instance, {}, Handler>>

  /** Convenience constants for `new Method(Method.POST, {...})` / `Method.create(Method.POST)` - a plain `'post'` string works just as well. */
  readonly ALL: 'all'
  readonly GET: 'get'
  readonly POST: 'post'
  readonly PUT: 'put'
  readonly DELETE: 'delete'
  readonly OPTIONS: 'options'
  readonly HEAD: 'head'
  readonly PATCH: 'patch'

  create: typeof MethodClass.create

  readonly prototype: MethodClass<any>
}

/**
 * `handler`'s field type: a concrete `MethodHandler<...>` once finished, or
 * - while `Handler` is `undefined` (pending) - the terminal chain call
 * itself, `<H extends MethodHandler<...>>(fn: H) => Method<..., H>`.
 */
export type MethodHandlerSlot<Props extends MethodProps> = Props['handler'] extends undefined
  ? <H extends MethodHandler<Props['path'], Props['drive'], Props['responder'], Props['schema'], Props['middlewares'], Props['context'], Props['instance'], Props['requestExt']>>(
      fn: H
    ) => Method<MergeProps<Props, { handler: H }>>
  : Props['handler']

export class MethodClass<
  const Props extends MethodProps = DefaultMethodProps
>{
  /** Convenience constants for `new Method(Method.POST, {...})` / `Method.create(Method.POST)` - a plain `'post'` string works just as well. */
  static readonly ALL: 'all' = 'all'
  static readonly GET: 'get' = 'get'
  static readonly POST: 'post' = 'post'
  static readonly PUT: 'put' = 'put'
  static readonly DELETE: 'delete' = 'delete'
  static readonly OPTIONS: 'options' = 'options'
  static readonly HEAD: 'head' = 'head'
  static readonly PATCH: 'patch' = 'patch'

  path: Props['path']
  param?: Props['path']
  method: Props['methodKey']
  schema?: Props['schema']

  name?: string
  use?: Props['middlewares']

  /**
   * While pending (`Handler` is `undefined`), this field's runtime value is
   * a self-replacing closure: calling it with the real handler assigns that
   * function back onto `handler` and returns `this`. Lexically bound to
   * `this`, so it still works detached from `route` (as `Asterflow`'s
   * `runHandler` does). Throws if called with anything but a function.
   */
  handler: MethodHandlerSlot<Props>

  /** Plugin registrations from `extend` (e.g. multipart's `.multipart(schema)`), read back via `route.extensions.multipart`. */
  readonly extensions: Record<string, unknown> = {}

  constructor (method: Props['methodKey'], options: MethodConstructorOptions<Props>) {
    this.path = (options.path ?? options.param) as Props['path']
    this.method = method
    this.schema = options.schema
    this.use = options.use

    // `options.handler` is `undefined` only from `Method.create(...)` below (cast past the type checker there).
    this.handler = (options.handler ?? ((fn: unknown) => {
      if (typeof fn !== 'function') {
        throw new TypeError('This route was built with Method.create(...) but never finished with a terminal .handler(...) call before being used.')
      }
      (this as unknown as { handler: unknown }).handler = fn
      return this
    })) as unknown as MethodHandlerSlot<Props>
  }

  /**
   * Defers `handler` to a terminal `.handler(fn)` call so plugins can chain
   * `request` extensions first, e.g.
   * `Method.create(Method.POST).multipart({...}).handler(...)`. Returns a
   * real `Method`, not a separate class.
   *
   * `options` is optional - every one of its fields already is - so a route
   * with nothing but a method and a deferred handler can skip it entirely:
   * `Method.create(Method.GET).handler(...)`.
   *
   * Static, not folded into the constructor: a constructor shares one set
   * of type-parameter defaults, and the default that infers an eager inline
   * handler's parameters isn't the one that correctly types a pending
   * route's `handler` field - verified empirically. Only a method can give
   * each its own.
   *
   * Plugins add their own chain method via `declare module '@asterflow/router'
   * { interface MethodClass<...> { theirMethod(...): Method<...> } }` plus a real
   * `MethodClass.prototype.theirMethod = ...` implementation calling `extend`.
   */
  static create<
    Responder extends Responders,
    const Path extends string = string,
    const Drive extends Runtime = Runtime,
    const MethodKey extends MethodKeys = MethodKeys,
    const Schema extends AnySchema = AnySchema,
    const Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
  >(
    method: MethodKey,
    options: MethodBuilderOptions<MethodCallProps<Responder, Path, Drive, MethodKey, Schema, Middlewares, MiddlewareOutput<Middlewares>, AnyAsterflow, {}, undefined>> = {}
  ): Method<MethodCallProps<Responder, Path, Drive, MethodKey, Schema, Middlewares, MiddlewareOutput<Middlewares>, AnyAsterflow, {}, undefined>> {
    return new MethodClass(method, {
      ...options,
      handler: undefined
    } as unknown as MethodConstructorOptions<any>)
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
  ): Method<MergeProps<Props, { requestExt: Props['requestExt'] & E, handler: Props['handler'] extends undefined ? undefined : any }>> {
    if (runtimeData) Object.assign(this.extensions, runtimeData)
    return this as unknown as Method<MergeProps<Props, { requestExt: Props['requestExt'] & E, handler: Props['handler'] extends undefined ? undefined : any }>>
  }
}

export type Method<Props extends MethodProps = DefaultMethodProps> = MethodClass<Props>

export const Method: MethodConstructor = MethodClass as unknown as MethodConstructor
