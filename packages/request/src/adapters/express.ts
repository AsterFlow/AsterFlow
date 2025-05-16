import type { Request as ERequest } from 'express'
import { Request } from '../controllers/Request'

export class ExpressRequest extends Request<ERequest> {
  constructor (request: ERequest) {
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
    const headers: Record<string, string> = {}

    for (const [key, value] of Object.entries(this.request.headers)) {
      if (Array.isArray(value)) {
        headers[key.toLowerCase()] = value.join(', ')
      } else if (typeof value === 'string') {
        headers[key.toLowerCase()] = value
      }
    }
  
    return headers
  }

  /**
   * Compose the full URL string: protocol://host[:port]/path?query
   */
  getPathname(): string {
    return this.request.url ?? '/'
  }

  /**
   * Returns the HTTP method of the request (GET, POST, etc.).
   */
  getMethod(): string {
    return this.request.method
  }
}