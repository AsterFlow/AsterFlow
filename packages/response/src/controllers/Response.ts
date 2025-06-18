import { ServerResponse } from 'http'
import type { BaseContext, BodyMap, Responders, ResponseOptions } from '../types/response'
import type { HttpHeader, Prettify } from '../types/utils'

export class AsterResponse<
  RawResponder extends Responders = Responders,
  BodySchema extends BodyMap<RawResponder> = BodyMap<RawResponder>,
  StatusCode extends keyof BodySchema = keyof BodySchema,
  Context extends BaseContext = BaseContext
> {
  protected _status: StatusCode
  body?: BodySchema[StatusCode]
  context: Context

  constructor(options?: ResponseOptions<RawResponder, BodySchema, StatusCode, Context>) {
    this._status = options?.code ?? (200 as StatusCode)
    this.body = options?.data
    this.context = options?.context ?? (({ header: {}, cookies: {} }) as Context)
  }
  
  status<NS extends keyof BodySchema>(code: NS) {
    this._status = code as unknown as StatusCode
    return this as unknown as AsterResponse<RawResponder, BodySchema, NS, Context>
  }
  code<NS extends keyof BodySchema>(code: NS) { return this.status(code) }
  getStatus() { return this._status }

  send(data: BodySchema[StatusCode]) {
    this.body = data
    return this as AsterResponse<RawResponder, BodySchema, StatusCode, Context>
  }
  json(data: BodySchema[StatusCode]) {
    type NewContext = Prettify<{
      header: Prettify<Context['header'] & { 'Content-Type': 'application/json' }>
      cookies: Context['cookies']
    }>

    this.send(data)
    this.context = {
      ...this.context,
      header: {
        ...this.context.header,
        'Content-Type': 'application/json'
      }
    }

    return this as unknown as AsterResponse<RawResponder, BodySchema, StatusCode, NewContext>
  }

  success(data: BodySchema[200]) {
    this.status(200)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 200, Context>
  }
  created(data: BodySchema[201]) {
    this.status(201)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 201, Context>
  }
  noContent(data: BodySchema[204]) {
    this.status(204)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 204, Context>
  }
  badRequest(data: BodySchema[400]) {
    this.status(400)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 400, Context>
  }
  unauthorized(data: BodySchema[401]) {
    this.status(401)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 401, Context>
  }
  forbidden(data: BodySchema[403]) {
    this.status(403)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 403, Context>
  }
  notFound(data: BodySchema[404]) {
    this.status(404)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 404, Context>
  }
  validationError(data: BodySchema[422]) {
    this.status(422)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 422, Context>
  }
  internalServerError(data: BodySchema[500]) {
    this.status(500)
    this.send(data as BodySchema[StatusCode])

    return this as AsterResponse<RawResponder, BodySchema, 500, Context>
  }

  setHeader<Name extends HttpHeader, Value extends string>(
    name: Name,
    value: Value
  ) {
    type NewContext = Prettify<{
      header: Prettify<Context['header'] & Record<Name, Value>>
      cookies: Context['cookies']
    }>

    this.context = {
      ...this.context,
      header: {
        ...this.context.header,
        [name]: value
      }
    }

    return this as unknown as AsterResponse<RawResponder, BodySchema, StatusCode, NewContext>
  }

  setCookie<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ) {
    type NewContext = Prettify<{
      header: Context['header']
      cookies: Prettify<Context['cookies'] & Record<Name, Value>>
    }>

    this.context = {
      ...this.context,
      cookies: {
        ...this.context.cookies,
        [name]: value
      }
    }
    
    return this as unknown as AsterResponse<RawResponder, BodySchema, StatusCode, NewContext>
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
  
    return new AsterResponse<RawResponder, BodySchema, keyof BodySchema, BaseContext>
  }
}