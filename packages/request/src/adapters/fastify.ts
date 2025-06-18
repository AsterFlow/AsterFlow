import { Runtime } from '@asterflow/adapter'
import type { FastifyRequest as FRequest } from 'fastify'
import { Request } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'

export function createFastifyRequest(request: FRequest) {
  const functions: RequestAbstract = {
    getBody(): unknown {
      return request.body
    },
    getHeaders(): Record<string, string> {
      return Object.entries(request.headers).reduce((acc, [key, value]) => {
        if (value === undefined) return acc
        acc[key] = Array.isArray(value) ? value.join(', ') : value
        return acc
      }, {} as Record<string, string>)
    },
    getPathname(): string {
      return request.url
    },
    getMethod(): string {
      return request.method
    }
  }

  return new Request<Runtime.Fastify>(request, functions)
}