import type { Runtime } from '@asterflow/adapter'
import type { Request as ERequest } from 'express'
import type { FastifyRequest as FRequest } from 'fastify'
import { IncomingMessage } from 'http'

export interface RequestType {
  [Runtime.Bun]: Request,
  [Runtime.Express]: ERequest,
  [Runtime.Fastify]: FRequest,
  [Runtime.Node]: IncomingMessage
}

export interface RequestAbstract {
  /*
   * Read and parse the request body.
   * Supports JSON and application/x-www-form-urlencoded.
   */
  getBody(): Promise<unknown> | unknown

  /*
   * Return all headers as a Record<string, string>, joining multiple values with commas.
   */
  getHeaders(): Record<string, string>

  /*
   * Returns the HTTP method of the request (GET, POST, etc.).
   */
  getMethod(): string

  /*
   * Compose the full URL string: protocol://host[:port]/path?query
   */
  getPathname(): string
}