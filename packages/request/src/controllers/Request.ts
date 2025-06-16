import type { Runtime } from '@asterflow/adapter'
import { Analyze } from '@asterflow/url-parser'
import type { RequestType } from '../types/request'

export abstract class Request<
  Drive extends Runtime = Runtime.Node,
>{
  raw: RequestType[Drive]
  public url: Analyze<string>

  constructor(request: RequestType[Drive]) {
    this.raw = request
    this.url = new Analyze(this.getPathname())
  }

  /**
   * Read and parse the request body.
   * Supports JSON and application/x-www-form-urlencoded.
   */
  abstract getBody(): Promise<unknown> | unknown

  /**
   * Return all headers as a Record<string, string>, joining multiple values with commas.
   */
  abstract getHeaders(): Record<string, string>

  /**
   * Returns the HTTP method of the request (GET, POST, etc.).
   */
  abstract getMethod(): string

  /**
   * Compose the full URL string: protocol://host[:port]/path?query
   */
  abstract getPathname(): string
}