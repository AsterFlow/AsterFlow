import type { Runtime } from '@asterflow/adapter'
import { Analyze } from '@asterflow/url-parser'
import type { RequestAbstract, RequestType } from '../types/request'

export class AsterRequest<
  const Drive extends Runtime = Runtime.Node,
  const Extension extends Record<string, any> = {}
> implements RequestAbstract {
  raw: RequestType[Drive]
  url: Analyze<string>
  private base: RequestAbstract

  constructor(request: RequestType[Drive], base: RequestAbstract) {
    this.raw = request
    this.url = new Analyze(base.getPathname()) 
    
    this.base = base
  }

  getBody() { return this.base.getBody() }
  getHeaders() { return this.base.getHeaders() }
  getMethod() { return this.base.getMethod() }
  getPathname() { return this.base.getPathname() }

  extend<E extends Record<string, any>>(extension: E) {
    Object.assign(this, extension)
    
    return this as unknown as Request<Drive, Extension & E>
  }
}

export type Request<
  Drive extends Runtime = Runtime.Node,
  Extension extends Record<string, any> = {}
> = AsterRequest<Drive, Extension> & Extension;

export const Request: {
  new <Drive extends Runtime = Runtime.Node>(
    request: RequestType[Drive],
    base: RequestAbstract
  ): Request<Drive, {}>
} = AsterRequest