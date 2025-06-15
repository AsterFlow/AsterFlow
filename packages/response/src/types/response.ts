import type { ServerResponse } from 'http'
import type { HttpHeader, Prettify } from './utils'

export interface Responders { [code: number]: unknown }
export type BodyMap<Responder extends Responders> = {
  [S in keyof Responder]: Responder[S]
}

export type BaseContext = {
  header: Record<string, string>
  cookies: Record<string, string>
}

export type ResponseOptions<
  RawResponder extends Responders,
  BodySchema extends BodyMap<RawResponder>,
  StatusCode extends keyof BodySchema,
  Context extends BaseContext
> = {
  data?: BodySchema[StatusCode]
  code?: StatusCode
  context?: Context
}

export interface IResponse<
  RawResponder extends Responders = Responders,
  BodySchema extends BodyMap<RawResponder> = BodyMap<RawResponder>,
  StatusCode extends keyof BodySchema = keyof BodySchema,
  Context extends BaseContext = BaseContext
> {
  readonly body?: BodySchema[keyof BodySchema]
  readonly context: Context

  status<NS extends keyof BodySchema>(code: NS): IResponse<RawResponder, BodySchema, NS, Context>
  getStatus(): StatusCode
  code<NS extends keyof BodySchema>(code: NS): IResponse<RawResponder, BodySchema, NS, Context>

  send(data: BodySchema[StatusCode]): IResponse<RawResponder, BodySchema, StatusCode, Context>

  json(
    data: BodySchema[StatusCode]
  ): IResponse<
    RawResponder,
    BodySchema,
    StatusCode,
    Prettify<{
      header: Prettify<Context['header'] & { 'Content-Type': 'application/json' }>
      cookies: Context['cookies']
    }>
  >

  success(data: BodySchema[200]): IResponse<RawResponder, BodySchema, 200, Context>
  created(data: BodySchema[201]): IResponse<RawResponder, BodySchema, 201, Context>
  noContent(data: BodySchema[204]): IResponse<RawResponder, BodySchema, 204, Context>
  badRequest(data: BodySchema[400]): IResponse<RawResponder, BodySchema, 400, Context>
  unauthorized(data: BodySchema[401]): IResponse<RawResponder, BodySchema, 401, Context>
  forbidden(data: BodySchema[403]): IResponse<RawResponder, BodySchema, 403, Context>
  notFound(data: BodySchema[404]): IResponse<RawResponder, BodySchema, 404, Context>
  validationError(data: BodySchema[422]): IResponse<RawResponder, BodySchema, 422, Context>
  internalServerError(data: BodySchema[500]): IResponse<RawResponder, BodySchema, 500, Context>

  setHeader<Name extends HttpHeader, Value extends string>(
    name: Name,
    value: Value
  ): IResponse<
    RawResponder,
    BodySchema,
    StatusCode,
    Prettify<{
      header: Prettify<Context['header'] & Record<Name, Value>>
      cookies: Context['cookies']
    }>
  >

  setCookie<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ): IResponse<
    RawResponder,
    BodySchema,
    StatusCode,
    Prettify<{
      header: Context['header']
      cookies: Prettify<Context['cookies'] & Record<Name, Value>>
    }>
  >

  toResponse(): globalThis.Response
  toServerResponse(output: ServerResponse): void
}