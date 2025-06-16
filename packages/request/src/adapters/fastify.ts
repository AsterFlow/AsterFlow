import { Runtime } from '@asterflow/adapter'
import type { FastifyRequest as FRequest } from 'fastify'
import { Request } from '../controllers/Request'

export class FastifyRequest extends Request<Runtime.Fastify> {
  constructor (request: FRequest) {
    super(request)
  }

  getBody(): unknown {
    return this.raw.body
  }

  getHeaders(): Record<string, string> {
    return Object.entries(this.raw.headers).reduce((acc, [key, value]) => {
      if (value === undefined) return acc
      acc[key] = Array.isArray(value) ? value.join(', ') : value
      return acc
    }, {} as Record<string, string>)
  }

  getPathname(): string {
    return this.raw.url
  }

  getMethod(): string {
    return this.raw.method
  }
}