import type { Runtime } from '@asterflow/adapter'
import type { Request as ExpressRequest } from 'express'
import { Request as AsterRequest } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'

/**
 * Creates an AsterFlow request adapter for Express runtime
 * @param request - Native Express Request object
 * @returns AsterRequest instance adapted for Express
 * @throws Error if request is null or undefined
 */
export function createExpressRequest(request: ExpressRequest): AsterRequest<Runtime.Express> {
  if (!request) {
    throw new Error('[ExpressAdapter] Request object is required')
  }

  const functions: RequestAbstract = {
    async getBody(): Promise<unknown> {
      try {
        // Express already parses body via middleware
        return request.body ?? {}
      } catch (error) {
        throw new Error(`[ExpressAdapter] Failed to read request body: ${(error as Error).message}`)
      }
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
      const pathname = request.originalUrl || request.url || '/'
      return pathname
    },

    getMethod(): string {
      return (request.method || 'GET').toUpperCase()
    }
  }

  return new AsterRequest<Runtime.Express>(request, functions)
}