import { Request } from '../controllers/Request'
import { IncomingMessage } from 'http'
import { parse as parseQs } from 'querystring'

export class NodeRequest extends Request<IncomingMessage> {
  constructor (request: IncomingMessage) {
    super(request)
  }
  
  /**
   * Read and parse the request body.
   * Supports JSON and application/x-www-form-urlencoded.
   */
  async getBody(): Promise<unknown> {
    const contentType = this.request.headers['content-type'] || ''
    const chunks: Buffer[] = []

    return new Promise<unknown>((resolve, reject) => {
      this.request.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      this.request.on('end', () => {
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
      this.request.on('error', (err) => {
        reject(new Error(`Error reading request body: ${err.message}`))
      })
    })
  }

  /**
   * Return all headers as a Record<string, string>, joining multiple values with commas.
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(this.request.headers)) {
      if (Array.isArray(value)) {
        headers[key.toLowerCase()] = value.join(', ')
      } else if (typeof value === 'string') {
        headers[key.toLowerCase()] = value
      }
    }
    return headers
  }

  /**
   * Compose the full URL string: protocol://host[:port]/path?query
   */
  getPathname(): string {
    return this.request?.url ?? '/'
  }

  /**
   * Returns the HTTP method of the request (GET, POST, etc.).
   */
  getMethod(): string {
    return this.request.method ?? 'GET'
  }

  getIps(): string[] {
    throw new Error('Method not implemented.')
  }
  getIp(): string {
    throw new Error('Method not implemented.')
  }
  getId(): string | undefined {
    throw new Error('Method not implemented.')
  }
}