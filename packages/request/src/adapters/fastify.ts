import type { Runtime } from '@asterflow/adapter'
import type { FastifyRequest } from 'fastify'
import { Request as AsterRequest } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'

/**
 * Creates an AsterFlow request adapter for Fastify runtime
 * @param request - Native Fastify Request object
 * @returns AsterRequest instance adapted for Fastify
 * @throws Error if request is null or undefined
 */
export function createFastifyRequest(request: FastifyRequest): AsterRequest<Runtime.Fastify> {
  if (!request) {
    throw new Error('[FastifyAdapter] Request object is required')
  }

  const functions: RequestAbstract = {
    async getBody(): Promise<unknown> {
      try {
        // Fastify already parses body
        return request.body ?? {}
      } catch (error) {
        throw new Error(`[FastifyAdapter] Failed to read request body: ${(error as Error).message}`)
      }
    },

    getHeaders(): Record<string, string> {
      return Object.entries(request.headers).reduce((acc, [key, value]) => {
        if (value === undefined) return acc
        acc[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value)
        return acc
      }, {} as Record<string, string>)
    },

    getPathname(): string {
      return request.url || '/'
    },

    getMethod(): string {
      return (request.method || 'GET').toUpperCase()
    }
  }

  return new AsterRequest<Runtime.Fastify>(request, functions)
}