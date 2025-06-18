import { type Runtime } from '@asterflow/adapter'
import type { Request as ERequest } from 'express'
import { Request } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'

export function createExpressRequest(request: ERequest) {
  const functions: RequestAbstract = {
    getBody(): unknown {
      return request.body
    },
    getHeaders(): Record<string, string> {
      const headers: Record<string, string> = {}

      for (const [key, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) {
          headers[key.toLowerCase()] = value.join(', ')
        } else if (typeof value === 'string') {
          headers[key.toLowerCase()] = value
        }
      }
  
      return headers
    },
    getPathname(): string {
      return request.url ?? '/'
    },
    getMethod(): string {
      return request.method
    }
  }

  return new Request<Runtime.Express>(request, functions)
}