import type { ResponseOptions } from "../types/response";

type BodyInit = ReadableStream | Bun.XMLHttpRequestBodyInit | URLSearchParams | AsyncGenerator<Uint8Array>;


export class Response<
  Data = unknown,
  Header extends Map<string, string> = Map<string, string>,
  Cookies extends Map<string, string> = Map<string, string>,
  Status extends number = 200,
> {
  protected readonly coder: Status;
  protected readonly data?: Data;
  readonly header: Header;
  protected readonly cookies: Cookies;

  constructor(options?: ResponseOptions<Data, Status, Header, Cookies>) {
    this.coder = options?.code ?? (200 as Status);
    this.data = options?.data;
    this.header = options?.header ?? (new Map() as Header);
    this.cookies = options?.cookies ?? (new Map() as Cookies);
  }

  protected clone<
    NewData = Data,
    NewCookies extends Map<string, string> = Cookies,
    NewHeader extends Map<string, string> = Header
  >(overrides: {
    data?: NewData;
    header?: NewHeader;
    cookies?: NewCookies;
  }): Response<NewData, NewHeader, NewCookies, Status>;
  
  protected clone<
    NewData,
    NewStatus extends number,
    NewCookies extends Map<string, string> = Cookies
  >(overrides: {
    code: NewStatus;
    data?: NewData;
    header?: Header;
    cookies?: NewCookies;
  }): Response<NewData, Header, NewCookies, NewStatus>;

  protected clone(overrides: {
    code?: number;
    data?: any;
    header?: Header;
    cookies?: Map<string, string>;
  }): Response<any, Header, any, number> {
    return new Response({
      code: overrides.code !== undefined ? overrides.code : this.coder,
      data: overrides.data !== undefined ? overrides.data : this.data,
      header: overrides.header !== undefined ? overrides.header : this.header,
      cookies: overrides.cookies !== undefined ? overrides.cookies : this.cookies,
    });
  }

  status<S extends number>(code: S): Response<Data, Header, Cookies, S> {
    return this.clone({ code });
  }
  code<S extends number>(code: S): Response<Data, Header, Cookies, S> {
    return this.status(code);
  }

  send<D>(data: D): Response<D, Header, Cookies, Status> {
    return this.clone({ data });
  }
  json<D>(data: D): Response<D, Header & Map<'Content-Type', 'application/json'>, Cookies, Status> {
    const newHeader = new Map(this.header) as Header & Map<'Content-Type', 'application/json'>;
    newHeader.set('Content-Type', 'application/json');
    return this.clone({ data, header: newHeader });
  }

  success<const D>(data: D): Response<D, Header, Cookies, 200> {
    return this.clone({ code: 200, data });
  }

  created<D>(data: D): Response<D, Header, Cookies, 201> {
    return this.clone({ code: 201, data });
  }

  noContent<D>(data: D): Response<D, Header, Cookies, 204> {
    return this.clone({ code: 204, data });
  }

  badRequest<D>(data: D): Response<D, Header, Cookies, 400> {
    return this.clone({ code: 400, data });
  }

  unauthorized<D>(data: D): Response<D, Header, Cookies, 401> {
    return this.clone({ code: 401, data });
  }

  forbidden<D>(data: D): Response<D, Header, Cookies, 403> {
    return this.clone({ code: 403, data });
  }

  notFound<D>(data: D): Response<D, Header, Cookies, 404> {
    return this.clone({ code: 404, data });
  }

  setCookie<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ): Response<Data, Header, Cookies & Map<Name, Value>, Status> {
    const newCookies = new Map(this.cookies) as Cookies & Map<Name, Value>;
    newCookies.set(name, value);
    return this.clone({ cookies: newCookies });
  }

  setHeader<Name extends string, Value extends string>(
    name: Name,
    value: Value
  ): Response<Data, Header & Map<Name, Value>, Cookies, Status> {
    const newHeader = new Map(this.header) as Header & Map<Name, Value>;
    newHeader.set(name, value);
    return this.clone({ header: newHeader });
  }

    /**
   * Converte esta instância na Response nativa do Fetch API.
   */
    public toResponse(): globalThis.Response {
      // 1) Constrói um objeto Headers a partir do Map
      const headers = new Headers();
      for (const [key, value] of this.header) {
        headers.set(key, value);
      }
  
      // 2) Adiciona cookies como cabeçalhos 'Set-Cookie'
      for (const [name, value] of this.cookies) {
        headers.append('Set-Cookie', `${name}=${value}`);
      }
  
      // 3) Serializa o corpo
      const contentType = headers.get('Content-Type');
      let body: BodyInit | null = null;
      if (this.data != null) {
        if (contentType === 'application/json') {
          body = JSON.stringify(this.data);
        } else {
          body = String(this.data);
        }
      }
  
      // 4) Retorna a Response nativa
      return new globalThis.Response(body, {
        status: this.coder,
        headers,
      });
    }
}

const response = new Response()
  .json({ message: 'Operação realizada com sucesso' });

console.log(response.header.get('Content-Type'))
