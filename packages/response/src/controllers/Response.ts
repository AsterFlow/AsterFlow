import { ServerResponse } from 'http'
import type { BaseContext, BodyMap, IResponse, Responders, ResponseOptions } from '../types/response'
import type { HttpHeader, Prettify } from '../types/utils'

export class Response<
  RawResponder extends Responders = Responders,
  BodySchema extends BodyMap<RawResponder> = BodyMap<RawResponder>,
  StatusCode extends keyof BodySchema = keyof BodySchema,
  Context extends BaseContext = BaseContext
> implements IResponse<RawResponder, BodySchema, StatusCode, Context> {
  protected readonly _status: StatusCode
  readonly body?: BodySchema[StatusCode]
  readonly context: Context

  constructor(options?: ResponseOptions<RawResponder, BodySchema, StatusCode, Context>) {
    this._status = options?.code ?? (200 as StatusCode)
    this.body = options?.data
    this.context = options?.context ?? (({ header: {}, cookies: {} }) as Context)
  }

  protected clone<NewContext extends BaseContext = Context>(overrides: {
    data?: BodySchema[StatusCode]
    context?: NewContext
  }): Response<RawResponder, BodySchema, StatusCode, NewContext>
  protected clone<NewStatus extends keyof BodySchema, NewContext extends Context = Context>(overrides: {
    code: NewStatus
    data?: BodySchema[NewStatus]
    context?: NewContext
  }): Response<RawResponder, BodySchema, NewStatus, NewContext>
  protected clone(overrides: { code?: keyof BodySchema; data?: BodySchema[keyof BodySchema]; context?: Context }): Response<RawResponder, BodySchema, keyof BodySchema, Context> {
    return new Response({
      code: overrides.code !== undefined ? overrides.code : this._status,
      data: overrides.data !== undefined ? overrides.data : this.body,
      context: overrides.context !== undefined ? overrides.context : this.context
    })
  }
  
  status<NS extends keyof BodySchema>(code: NS) { return this.clone({ code }) }
  getStatus() { return this._status }
  code<NS extends keyof BodySchema>(code: NS) { return this.status(code) }

  send(data: BodySchema[StatusCode]) { return this.clone({ data }) }
  json(data: BodySchema[StatusCode]) {
    type NewContext = Prettify<{
      header: Prettify<Context['header'] & { 'Content-Type': 'application/json' }>
      cookies: Context['cookies']
    }>
    
    return this.clone<NewContext>({
      data,
      context: {
        ...this.context,
        header: {
          ...this.context.header,
          'Content-Type': 'application/json'
        }
      } as NewContext
    })
  }

  success(data: BodySchema[200]) { return this.clone({ code: 200, data }) }
  created(data: BodySchema[201]) { return this.clone({ code: 201, data }) }
  noContent(data: BodySchema[204]) { return this.clone({ code: 204, data }) }
  badRequest(data: BodySchema[400]) { return this.clone({ code: 400, data }) }
  unauthorized(data: BodySchema[401]) { return this.clone({ code: 401, data }) }
  forbidden(data: BodySchema[403]) { return this.clone({ code: 403, data }) }
  notFound(data: BodySchema[404]) { return this.clone({ code: 404, data }) }
  validationError(data: BodySchema[422]) { return this.clone({ code: 422, data }) }
  internalServerError(data: BodySchema[500]) { return this.clone({ code: 500, data }) }

  setHeader<Name extends HttpHeader, Value extends string>(
    name: Name,
    value: Value
  ) {
    type NewContext = Prettify<{
      header: Prettify<Context['header'] & Record<Name, Value>>
      cookies: Context['cookies']
    }>

    return this.clone<NewContext>({
      context: {
        ...this.context,
        header: {
          ...this.context.header,
          [name]: value
        }
      } as unknown as NewContext
    })
  }

  setCookie<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ) {
    type NewContext = Prettify<{
      header: Context['header']
      cookies: Prettify<Context['cookies'] & Record<Name, Value>>
    }>

    return this.clone<NewContext>({
      context: {
        header: this.context.header,
        cookies: {
          ...this.context.cookies,
          [name]: value
        }
      } as NewContext
    })
  }
  
  toResponse(): globalThis.Response {
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    for (const [k, v] of Object.entries(this.context.header)) headers.set(k, v)
    if (typeof this.body === 'object' || Array.isArray(this.body)) {
      headers.set('Content-Type', 'application/json')
    }
    for (const [n, v] of Object.entries(this.context.cookies)) headers.append('Set-Cookie', `${n}=${v}`)
    const body = headers.get('Content-Type') === 'application/json' ? JSON.stringify(this.body) : String(this.body)
    return new globalThis.Response(body, {
      status: this._status as number,
      headers
    })
  }
  
  toServerResponse(output: ServerResponse): void {
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')

    for (const [k, v] of Object.entries(this.context.header)) headers.set(k, v)
    if (typeof this.body === 'object' || Array.isArray(this.body)) {
      headers.set('Content-Type', 'application/json')
    }

    for (const [n, v] of Object.entries(this.context.cookies)) headers.append('Set-Cookie', `${n}=${v}`)
    const body = headers.get('Content-Type') === 'application/json' ? JSON.stringify(this.body) : String(this.body)
    output.writeHead(this._status as number, Object.fromEntries(headers))
    output.end(body)
  }

  static create<RawResponder extends Responders>() {
    type BodySchema = BodyMap<RawResponder>
  
    return new Response<RawResponder, BodySchema, keyof BodySchema, BaseContext>
  }
}