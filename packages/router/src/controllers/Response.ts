import type { BodyMap, ResponseOptions } from '../types/response'
import type { Responders } from '../types/router'
import { ServerResponse } from 'http'

export class Response<
  Responder extends Responders = Responders,
  BM extends BodyMap<Responder> = BodyMap<Responder>,
  Status extends keyof BM = keyof BM,
  Header extends Map<string, string> = Map<string, string>,
  Cookies extends Map<string, string> = Map<string, string>,
> {
  protected readonly _status: Status
  readonly body?: BM[Status]
  readonly header: Header
  readonly cookies: Cookies

  constructor(options?: ResponseOptions<
    Responder,
    BM,
    Status,
    Header,
    Cookies
  >) {
    this._status = options?.code ?? (200 as Status)
    this.body = options?.data
    this.header = options?.header ?? (new Map() as Header)
    this.cookies = options?.cookies ?? (new Map() as Cookies)
  }

  // Overload 1: não se altera o status (usa o status atual)
  protected clone<
    NewHeader extends Map<string, string> = Header,
    NewCookies extends Map<string, string> = Cookies
  >(overrides: {
    data?: BM[Status]
    header?: NewHeader
    cookies?: NewCookies
  }): Response<Responder, BM, Status, NewHeader, NewCookies>

  // Overload 2: altera o status (o novo status é fornecido via `code`)
  protected clone<
    NewStatus extends keyof BM,
    NewCookies extends Map<string, string> = Cookies
  >(overrides: {
    code: NewStatus
    data?: BM[NewStatus]
    header?: Header
    cookies?: NewCookies
  }): Response<Responder, BM, NewStatus, Header, NewCookies>

  protected clone(overrides: {
    code?: keyof BM
    data?: BM[keyof BM]
    header?: Map<string, string>
    cookies?: Map<string, string>
  }): Response<Responder, BM, keyof BM, Map<string, string>, Map<string, string>> {
    return new Response<Responder, BM, keyof BM, Map<string, string>, Map<string, string>>({
      code: overrides.code !== undefined ? overrides.code : this._status,
      data: overrides.data !== undefined ? overrides.data : this.body,
      header: overrides.header !== undefined ? overrides.header : this.header,
      cookies: overrides.cookies !== undefined ? overrides.cookies : this.cookies,
    })
  }

  // --- Core Methods ---
  status<NS extends keyof BM>(code: NS) {
    return this.clone({ code })
  }
  getStatus() {
    return this._status
  }
  code<NS extends keyof BM>(code: NS) {
    return this.status(code)
  }

  send(data: BM[Status]) {
    return this.clone({ data })
  }
  json(data: BM[Status]) {
    const newHeader = new Map(this.header) as Header & Map<'Content-Type', 'application/json'>
    newHeader.set('Content-Type', 'application/json')
    return this.clone({ data, header: newHeader })
  }

  // --- Response Helpers ---
  success(data: BM[200]) { return this.clone({ code: 200, data }) }
  created(data: BM[201]) { return this.clone({ code: 201, data }) }
  noContent(data: BM[204]) { return this.clone({ code: 204, data }) }
  badRequest(data: BM[400]) { return this.clone({ code: 400, data }) }
  unauthorized(data: BM[401]) { return this.clone({ code: 401, data }) }
  forbidden(data: BM[403]) { return this.clone({ code: 403, data }) }
  notFound(data: BM[404]) { return this.clone({ code: 404, data }) }

  setHeader<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ): Response<Responder, BM, Status, Header & Map<Name, Value>, Cookies> {
    const newHeader = new Map(this.header) as Header & Map<Name, Value>
    newHeader.set(name, value)
    return this.clone({ header: newHeader })
  }

  setCookie<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ): Response<Responder, BM, Status, Header, Cookies & Map<Name, Value>> {
    const newCookies = new Map(this.cookies) as Cookies & Map<Name, Value>
    newCookies.set(name, value)
    return this.clone({ cookies: newCookies })
  }

  toResponse(): globalThis.Response {
    const headers = new Headers()
  
    // Add headers
    headers.set('Content-Type', 'text/plain')
    for (const [k, v] of this.header) headers.set(k, v)
    
    if (typeof this.body === 'object' || Array.isArray(this.body)) {
      headers.set('Content-Type', 'application/json')
    }

    // Add cookies
    for (const [n, v] of this.cookies) headers.append('Set-Cookie', `${n}=${v}`)

    const body = headers.get('Content-Type') === 'application/json'
      ? JSON.stringify(this.body)
      : String(this.body)
  
    return new globalThis.Response(body, {
      status: this._status as number,
      headers,
    })
  }

  toServerResponse(output: ServerResponse): void {
    const headers = new Headers()

    // Add headers
    headers.set('Content-Type', 'text/plain')
    for (const [k, v] of this.header) headers.set(k, v)
    
    if (typeof this.body === 'object' || Array.isArray(this.body)) {
      headers.set('Content-Type', 'application/json')
    }

    // Add cookies
    for (const [n, v] of this.cookies) headers.append('Set-Cookie', `${n}=${v}`)

    const body = headers.get('Content-Type') === 'application/json'
      ? JSON.stringify(this.body)
      : String(this.body)

    output.writeHead(this._status as number, Object.fromEntries(headers))
    output.end(body)
  }
}
