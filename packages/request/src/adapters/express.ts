import { type Runtime } from '@asterflow/adapter'
import type { Request as ERequest } from 'express'
import { Request } from '../controllers/Request'

export class ExpressRequest extends Request<Runtime.Express> {
  constructor (request: ERequest) {
    super(request)
  }

  getBody(): unknown {
    return this.raw.body
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    for (const [key, value] of Object.entries(this.raw.headers)) {
      if (Array.isArray(value)) {
        headers[key.toLowerCase()] = value.join(', ')
      } else if (typeof value === 'string') {
        headers[key.toLowerCase()] = value
      }
    }
  
    return headers
  }

  getPathname(): string {
    return this.raw.url ?? '/'
  }

  getMethod(): string {
    return this.raw.method
  }
}