import type { Runtime } from '@asterflow/adapter'
import { Request as AsterRequest } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'

/**
 * Creates an AsterFlow request adapter for Bun runtime
 * @param request - Native Bun Request object
 * @returns AsterRequest instance adapted for Bun
 * @throws Error if request is null or undefined
 */
export function createBunRequest(request: Request): AsterRequest<Runtime.Bun> {
  if (!request) {
    throw new Error('[BunAdapter] Request object is required')
  }

  let cachedBody: unknown = undefined
  let bodyRead = false

  const functions: RequestAbstract = {
    async getBody(): Promise<unknown> {
      try {
        // Return cached body if already read
        if (bodyRead) return cachedBody

        // Try to clone and read the request body
        const clonedRequest = request.clone()
        
        try {
          // Try JSON first, fallback to text
          cachedBody = await clonedRequest.json().catch(() => clonedRequest.text())
        } catch {
          // If cloning fails (body already used), return empty object
          cachedBody = {}
        }
        
        bodyRead = true
        return cachedBody
      } catch (error) {
        throw new Error(`[BunAdapter] Failed to read request body: ${(error as Error).message}`)
      }
    },

    getHeaders(): Record<string, string> {
      const headers: Record<string, string> = {}

      request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value
      })

      return headers
    },

    getPathname(): string {
      try {
        const url = new URL(request.url)
        return url.pathname + url.search
      } catch {
        return request.url || '/'
      }
    },

    getMethod(): string {
      return (request.method || 'GET').toUpperCase()
    }
  }

  return new AsterRequest<Runtime.Bun>(request, functions)
}