import type { BaseShapeAbstract } from '@caeljs/config'
import type { ZodTypeAny } from 'zod'
import type { MiddlewareOptions } from '../types/mindleware'
import type { Responders } from '../types/router'

export class Middleware<
  Responder extends Responders,
  Schema extends BaseShapeAbstract<any> | ZodTypeAny,
  const Name extends string = string,
  const Parameters extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly name: Name
  readonly onRun

  constructor(options: MiddlewareOptions<Responder, Schema, Name, Parameters>) {
    this.name = options.name
    this.onRun = options.onRun
  }
}