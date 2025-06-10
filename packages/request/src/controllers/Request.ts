import { Analyze } from 'url-ast'

export abstract class Request<RequestType>{
  request: RequestType
  public url: Analyze<string>

  constructor(request: RequestType) {
    this.request = request
    this.url = new Analyze(this.getPathname())
  }

  abstract getBody(): Promise<unknown> | unknown
  abstract getHeaders(): Record<string, string>
  abstract getMethod(): string

  abstract getPathname(): string
}