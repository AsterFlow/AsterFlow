import type { MiddlewareOptions } from '../types/mindleware'
import type { Responders } from '../types/router'
import type { AnySchema } from '../types/schema'

export class Middleware<
  Responder extends Responders,
  Schema extends AnySchema,
  const Name extends string = string,
  const Parameters extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly name: Name
  readonly onRun

  constructor(options: MiddlewareOptions<Responder, Schema, Name, Parameters>) {
    this.name = options.name
    this.onRun = options.onRun
    /*
    this.onSuccess = options.onSuccess
    this.onFailure = options.onFailure
    */
  }
}