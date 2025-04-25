import type { BaseShapeAbstract } from '@caeljs/config'
import type { ZodTypeAny } from 'zod'
import type { AsterRequest } from '../controllers/Request'
import type { Response } from '../controllers/Response'
import type { AsterRequestTypes, InferSchema } from '../types/method'
import type { Responders } from '../types/router'

export type MiddlewareOptions<
  Responder extends Responders = Responders,
  Schema extends BaseShapeAbstract<any> | ZodTypeAny = BaseShapeAbstract<any> | ZodTypeAny,
  Name extends string = string,
  Parameters extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: Name,
  onRun(args: {
    response: Response<Responder>;
    request: AsterRequest<AsterRequestTypes>
    schema: InferSchema<Schema>
    next:<Parameter extends Record<string, unknown>>(params: Parameter) => MiddlewareOptions<Responder, Schema, Name, Parameter>
  }): MiddlewareOptions<Responder, Schema, Name, Parameters>
}