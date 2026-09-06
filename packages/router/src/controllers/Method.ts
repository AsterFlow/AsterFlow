import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow } from 'asterflow'
import type { Responders } from '@asterflow/response'
import type { DefaultMethodProps, MethodBuilderOptions, MethodCallProps, MethodHandler, MethodKeys, MethodOptions, MethodProps } from '../types/method'
import type { MiddlewareOutput } from '../types/mindleware'
import type { AnySchema } from '../types/schema'
import type { MergeProps } from '../types/utils'
import type { Middleware } from './Middleware'

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

export class Method<
  const Props extends MethodProps = DefaultMethodProps
>{
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

  constructor (options: MethodOptions<Props>) {
    this.path = (options.path ?? options.param) as Props['path']
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
    })) as unknown as MethodHandlerSlot<Props>
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
    options: MethodBuilderOptions<MethodCallProps<Responder, Path, Drive, MethodKey, Schema, Middlewares, MiddlewareOutput<Middlewares>, AnyAsterflow, {}, undefined>>
  ): Method<MethodCallProps<Responder, Path, Drive, MethodKey, Schema, Middlewares, MiddlewareOutput<Middlewares>, AnyAsterflow, {}, undefined>> {
    return new Method({
      ...options,
      handler: undefined
    } as unknown as MethodOptions<any>)
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
