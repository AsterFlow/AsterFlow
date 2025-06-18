import type { Runtime } from '@asterflow/adapter'
import type { Request } from '@asterflow/request'
import type { Responders, AsterResponse } from '@asterflow/response'
import type { Middleware } from '../controllers/Middleware'
import type { AnySchema, InferSchema } from './schema'

export type AnyMiddleware = Middleware<any, any, any, any>

/**
 * Accumulate the output types (`P`) from an array of middlewares into a single object
 */
export type MiddlewareOutput<Ms extends readonly AnyMiddleware[]> =
  Ms extends readonly [infer First, ...infer Rest]
    ? First extends Middleware<any, any, any, infer P>
      ? Rest extends readonly AnyMiddleware[]
        ? P & MiddlewareOutput<Rest>
        : P
      : unknown
    : unknown

export type MiddlewareOptions<
  Responder extends Responders = Responders,
  Schema extends AnySchema = AnySchema,
  Name extends string = string,
  Parameters extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: Name,
  onRun <RequestType extends Runtime> (args: {
    response: AsterResponse<Responder>;
    request: Request<RequestType>
    schema: InferSchema<Schema>
    next:<Parameter extends Record<string, unknown>>(params: Parameter) => MiddlewareOptions<Responder, Schema, Name, Parameter>
  }): MiddlewareOptions<Responder, Schema, Name, Parameters>
  /*
  onSuccess?: (args: {
    response: Response<Responder>;
    request: AsterRequest<AsterRequestTypes>
    schema: InferSchema<Schema>
    next:<Parameter extends Record<string, unknown>>(params: Parameter) => MiddlewareOptions<Responder, Schema, Name, Parameter>
  }) => MiddlewareOptions<Responder, Schema, Name, Parameters>
  onFailure?: (args: {
    response: Response<Responder>;
    request: AsterRequest<AsterRequestTypes>
    schema: InferSchema<Schema>
    next:<Parameter extends Record<string, unknown>>(params: Parameter) => MiddlewareOptions<Responder, Schema, Name, Parameter>
  }) => MiddlewareOptions<Responder, Schema, Name, Parameters>
   */
}