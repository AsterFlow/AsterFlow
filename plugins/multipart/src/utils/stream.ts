import type { IncomingMessage } from 'http'
import { Readable } from 'stream'
import { MultipartError, ErrorCodes } from '../types/multipart'

type Pipeable = IncomingMessage

function isPipeable(value: unknown): value is Pipeable {
  return (
    typeof value === 'object'
    && value !== null
    && typeof (value as { pipe?: unknown }).pipe === 'function'
  )
}

function isWebRequest(value: unknown): value is Request {
  return (
    typeof value === 'object'
    && value !== null
    && typeof (value as { headers?: { forEach?: unknown } }).headers?.forEach === 'function'
    && 'body' in value
  )
}

/**
 * Resolves the raw request object handed to `AsterRequest` (which differs per
 * adapter - Node, Express, Fastify, Bun) into something we can pipe into
 * busboy. Returns `null` when the request has no body to read (e.g. a Bun
 * `Request` with a null body).
 */
export function resolveStream(raw: unknown): Readable | null {
  // Node & Express: `raw` is (or extends) http.IncomingMessage
  if (isPipeable(raw)) return raw as unknown as Readable

  // Fastify: `raw` is a FastifyRequest, whose real IncomingMessage lives at `.raw`
  const nested = (raw as { raw?: unknown } | null)?.raw
  if (isPipeable(nested)) return nested as unknown as Readable

  // Bun: `raw` is a Web API Request, whose body is a ReadableStream<Uint8Array> | null
  if (isWebRequest(raw)) {
    const body = (raw as Request).body
    if (!body) return null
    return Readable.fromWeb(body as any)
  }

  throw new MultipartError(
    'Unsupported request type for multipart parsing',
    ErrorCodes.PARSE_ERROR
  )
}
