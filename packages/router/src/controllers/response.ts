import type { BodyMap, ResponseOptions } from "../types/response"
import type { Responders } from "../types/router"

type BodyInit =
  | ReadableStream
  | Bun.XMLHttpRequestBodyInit
  | URLSearchParams
  | AsyncGenerator<Uint8Array>
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


  status<NS extends keyof BM>(code: NS) { return this.clone({ code }) }
  getStatus() { return this._status }
  code<NS extends keyof BM>(code: NS) { return this.status(code) }

  send(data: BM[Status]) { return this.clone({ data }) }
  json(data: BM[Status]) {
    const newHeader = new Map(this.header) as Header & Map<"Content-Type", "application/json">
    newHeader.set("Content-Type", "application/json")
    return this.clone({ data, header: newHeader })
  }

  // helpers fixos usam BM[200], BM[201], BM[204], etc.
  success(data: BM[200]) { return this.clone({ code: 200, data }) }
  created(data: BM[201]) { return this.clone({ code: 201, data }) }
  noContent(data: BM[204]) { return this.clone({ code: 204, data }) }
  badRequest(data: BM[400]) { return this.clone({ code: 400, data }) }
  unauthorized(data: BM[401]) { return this.clone({ code: 401, data }) }
  forbidden(data: BM[403]) { return this.clone({ code: 403, data }) }
  notFound(data: BM[404]) { return this.clone({ code: 404, data }) }

  setCookie<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ): Response<Responder, BM, Status, Header, Cookies & Map<Name, Value>> {
    const newCookies = new Map(this.cookies) as Cookies & Map<Name, Value>
    newCookies.set(name, value)
    return this.clone({ cookies: newCookies })
  }

  setHeader<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ): Response<Responder, BM, Status, Header & Map<Name, Value>, Cookies> {
    const newHeader = new Map(this.header) as Header & Map<Name, Value>
    newHeader.set(name, value)
    return this.clone({ header: newHeader })
  }

  public toResponse(): globalThis.Response {
    const headers = new Headers()
  
    // Copia os cabeçalhos definidos
    for (const [k, v] of this.header) {
      headers.set(k, v)
    }
  
    // Se nenhum Content-Type foi definido, configura com base no tipo dos dados
    if (!headers.has("Content-Type")
        && this.body !== undefined
        && typeof this.body === "object"
      ) {
      headers.set("Content-Type", "application/json")
    } else {
      headers.set("Content-Type", "text/plain")
    }

    // Configura os cookies
    for (const [n, v] of this.cookies) {
      headers.append("Set-Cookie", `${n}=${v}`)
    }
  
    // Define o corpo da resposta conforme o Content-Type
    let body: BodyInit | null = null
    if (this.body !== undefined) {
      if (headers.get("Content-Type") === "application/json") {
        body = JSON.stringify(this.body)
      } else {
        body = String(this.body)
      }
    }
  
    return new globalThis.Response(body, {
      status: this._status as number,
      headers,
    })
  }
  
}

import { ServerResponse } from 'http';

export function toServerResponse(
  customResponse: Response<any, any, any, any, any>,
  res: ServerResponse
): void {
  // Set status code
  res.statusCode = customResponse.getStatus() as number;

  const setCookies: string[] = [];

  // Process headers from header Map
  for (const [key, value] of customResponse.header) {
    if (key.toLowerCase() === 'set-cookie') {
      setCookies.push(value);
    } else {
      res.setHeader(key, value);
    }
  }

  // Add cookies from cookies Map
  for (const [name, value] of customResponse.cookies) {
    setCookies.push(`${name}=${value}`);
  }

  // Set combined cookies
  if (setCookies.length > 0) {
    res.setHeader('Set-Cookie', setCookies);
  }

  // Determine Content-Type if not set
  if (!res.hasHeader('Content-Type')) {
    if (customResponse.body !== undefined && typeof customResponse.body === 'object') {
      res.setHeader('Content-Type', 'application/json');
    } else {
      res.setHeader('Content-Type', 'text/plain');
    }
  }

  // Send response body
  if (customResponse.body !== undefined) {
    const contentType = res.getHeader('Content-Type');
    let body: string;

    if (typeof contentType === 'string' && contentType.includes('application/json')) {
      body = JSON.stringify(customResponse.body);
    } else {
      body = String(customResponse.body);
    }

    res.end(body);
  } else {
    res.end();
  }
}