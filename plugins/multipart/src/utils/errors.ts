import type { AsterResponse } from '@asterflow/response'
import { ErrorCodes, type MultipartError } from '../types/multipart'

/** Maps a `MultipartError` to a standardized `{ error, code, message, details? }` HTTP response. */
export function errorResponse(response: AsterResponse, error: MultipartError) {
  const body = {
    code: error.code,
    message: error.message,
    ...(error.details !== undefined ? { details: error.details } : {})
  }

  switch (error.code) {
  case ErrorCodes.LIMIT_FILE_SIZE:
  case ErrorCodes.LIMIT_FILE_COUNT:
  case ErrorCodes.LIMIT_FIELD_SIZE:
  case ErrorCodes.LIMIT_FIELD_COUNT:
  case ErrorCodes.LIMIT_PARTS:
    return response.status(413).json({ error: 'PAYLOAD_TOO_LARGE', ...body })
  case ErrorCodes.INVALID_MIME_TYPE:
  case ErrorCodes.INVALID_EXTENSION:
    return response.status(415).json({ error: 'UNSUPPORTED_MEDIA_TYPE', ...body })
  case ErrorCodes.VALIDATION_FAILED:
  case ErrorCodes.FIELD_REQUIRED:
  case ErrorCodes.FIELD_TOO_MANY_FILES:
    return response.validationError({ error: 'VALIDATION_FAILED', ...body })
  default:
    return response.badRequest({ error: 'MULTIPART_ERROR', ...body })
  }
}
