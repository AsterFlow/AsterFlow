import type { FastifyRequest as FRequest } from 'fastify'
import { Request } from '../controllers/Request'

export class FastifyRequest extends Request<FRequest> {
  constructor (request: FRequest) {
    super(request)
  }
  
  /**
   * Read and parse the request body.
   * Supports JSON and application/x-www-form-urlencoded.
   */
  getBody(): unknown {
    return this.request.body
  }

  /**
   * Return all headers as a Record<string, string>, joining multiple values with commas.
   */
  getHeaders(): Record<string, string> {
    return Object.entries(this.request.headers).reduce((acc, [key, value]) => {
      if (value === undefined) return acc
      acc[key] = Array.isArray(value) ? value.join(', ') : value
      return acc
    }, {} as Record<string, string>)
  }


  getPathname(): string {
    return this.request.url
  }

  /**
   * Returns the HTTP method of the request (GET, POST, etc.).
   */
  getMethod(): string {
    return this.request.method
  }
}