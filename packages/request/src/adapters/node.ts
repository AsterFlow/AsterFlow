import { IncomingMessage } from 'http'
import { parse as parseQs } from 'querystring'
import { Request } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'

export function createNodeRequest(request: IncomingMessage) {
  const functions: RequestAbstract = {
    async getBody(): Promise<unknown> {
      const contentType = request.headers['content-type'] || ''
      const chunks: Buffer[] = []

      return new Promise<unknown>((resolve, reject) => {
        request.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        request.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8').trim()
          try {
            if (contentType.includes('application/json')) {
              return resolve(raw ? JSON.parse(raw) : {})
            }
            if (contentType.includes('application/x-www-form-urlencoded')) {
              return resolve(raw ? parseQs(raw) : {})
            }
            // Other content types: return raw string
            return resolve(raw)
          } catch (err) {
            return reject(new Error(`Failed to parse body as ${contentType}: ${(err as Error).message}`))
          }
        })
        request.on('error', (err) => {
          reject(new Error(`Error reading request body: ${err.message}`))
        })
      })
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
      return request?.url ?? '/'
    },

    getMethod(): string {
      return request.method ?? 'GET'
    }
  }

  return new Request(request, functions)
}