import type { Runtime } from '@asterflow/adapter'
import { Request as Requester } from '../controllers/Request'

export class BunRequest extends Requester<Runtime.Bun> {
  constructor (request: Request) {
    super(request)
  }
  
  async getBody(): Promise<unknown> {
    return this.raw.clone().json().catch(() => this.raw.text())
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    this.raw.headers.forEach((value, key) => {
      headers[key] = value
    })
    return headers
  }

  getPathname(): string {
    return this.raw.url
  }

  getMethod(): string {
    return this.raw.method
  }
}