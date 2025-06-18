import { AsterResponse } from '@asterflow/response'

interface ErrorPayload {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Turn any thrown value into a Response.
 */
export function toErrorResponse(err: unknown): AsterResponse {
  let payload: ErrorPayload

  if (err instanceof AsterResponse) {
    // If someone threw an already-built Response, bubble it through.
    return err
  } else if (err instanceof Error) {
    payload = {
      statusCode: 500,
      error: err.name,
      message: err.message,
      // Optionally attach stack in non-prod
      details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    }
  } else {
    // Non-Error (string, number, object, etc.)
    payload = {
      statusCode: 500,
      error: 'InternalServerError',
      message: typeof err === 'string' ? err : 'An unexpected error occurred.',
      details: err
    }
  }

  // Always log the full err for diagnostics
  console.error('Unhandled exception in adapter:', err)

  return new AsterResponse().status(payload.statusCode).json({
    error: payload.error,
    message: payload.message,
    ...(payload.details ? { details: payload.details } : {})
  })
}
