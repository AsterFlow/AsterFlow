import { Request as Adapter } from '../controllers/Request'

export class BunRequest extends Adapter<Request> {
  constructor (request: Request) {
    super(request)
  }
  
  /**
   * Read and parse the request body.
   * Supports JSON and application/x-www-form-urlencoded.
   */
  async getBody(): Promise<unknown> {
    return this.request.clone().json().catch(() => this.request.text())
  }

  /**
   * Return all headers as a Record<string, string>, joining multiple values with commas.
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    this.request.headers.forEach((value, key) => {
      headers[key] = value
    })
    return headers
  }

  /**
   * Compose the full URL string: protocol://host[:port]/path?query
   */
  getPathname(): string {
    return this.request.url
  }

  /**
   * Returns the HTTP method of the request (GET, POST, etc.).
   */
  getMethod(): string {
    return this.request.method
  }
}