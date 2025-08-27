import type { IncomingMessage } from 'http'
import { parse as parseQs } from 'querystring'
import type { Runtime } from '@asterflow/adapter'
import { Request as AsterRequest } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'

/**
 * Creates an AsterFlow request adapter for Node.js runtime
 * @param request - Native Node.js IncomingMessage object
 * @returns AsterRequest instance adapted for Node.js
 * @throws Error if request is null or undefined
 */
export function createNodeRequest(request: IncomingMessage): AsterRequest<Runtime.Node> {
  if (!request) throw new Error('[NodeAdapter] Request object is required')

  const functions: RequestAbstract = {
    async getBody(): Promise<unknown> {
      try {
        // Check if stream is already consumed
        if (request.readableEnded || request.destroyed) return {}
        const contentType = request.headers['content-type'] || ''
        const chunks: Buffer[] = []

        return new Promise<unknown>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('[NodeAdapter] Request body read timeout (30s)'))
          }, 30000)

          request.on('data', (chunk: Buffer) => chunks.push(chunk))

          request.on('end', () => {
            clearTimeout(timeout)
            const raw = Buffer.concat(chunks).toString('utf-8').trim()
            
            try {
              if (contentType.includes('application/json')) {
                resolve(raw ? JSON.parse(raw) : {})
              } else if (contentType.includes('application/x-www-form-urlencoded')) {
                resolve(raw ? parseQs(raw) : {})
              } else {
                resolve(raw || '')
              }
            } catch (err) {
              reject(new Error(`[NodeAdapter] Failed to parse body as ${contentType}: ${(err as Error).message}`))
            }
          })

          request.on('error', (err) => {
            clearTimeout(timeout)
            reject(new Error(`[NodeAdapter] Error reading request body: ${err.message}`))
          })
        })
      } catch (error) {
        throw new Error(`[NodeAdapter] Failed to read request body: ${(error as Error).message}`)
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
      return request.url || '/'
    },

    getMethod(): string {
      return (request.method || 'GET').toUpperCase()
    }
  }

  return new AsterRequest<Runtime.Node>(request, functions)
}