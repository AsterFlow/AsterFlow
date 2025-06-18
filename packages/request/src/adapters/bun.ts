import type { Runtime } from '@asterflow/adapter'
import { Request as Requester } from '../controllers/Request'
import type { RequestAbstract } from '../types/request'


export function createBunRequest(request: Request) {
  const functions: RequestAbstract = {
    async getBody(): Promise<unknown> {
      return request.clone().json().catch(() => request.text())
    },
    getHeaders(): Record<string, string> {
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        headers[key] = value
      })
      return headers
    },
    getPathname(): string {
      return request.url
    },
    getMethod(): string {
      return request.method
    }
  }

  return new Requester<Runtime.Bun>(request, functions)
}