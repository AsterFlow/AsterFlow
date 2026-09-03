import { MultipartError, ErrorCodes, type MultipartFields, type MultipartResult } from '../types/multipart'

/** Validates parsed files against a route's declared `multipart` field criteria. Throws the first `MultipartError` found. */
export function validateFields(result: MultipartResult, schema: MultipartFields): void {
  for (const [field, criteria] of Object.entries(schema)) {
    const files = result.files.filter((file) => file.fieldName === field)
    const multiple = criteria.multiple ?? false
    const required = criteria.required ?? false

    if (required && files.length === 0) {
      throw new MultipartError(`Field "${field}" is required`, ErrorCodes.FIELD_REQUIRED, { field })
    }

    if (!multiple && files.length > 1) {
      throw new MultipartError(
        `Field "${field}" accepts only a single file`,
        ErrorCodes.FIELD_TOO_MANY_FILES,
        { field, count: files.length }
      )
    }

    for (const file of files) {
      if (criteria.mimeTypes && !criteria.mimeTypes.includes(file.mimeType)) {
        throw new MultipartError(
          `Field "${field}" has unsupported MIME type: ${file.mimeType}`,
          ErrorCodes.INVALID_MIME_TYPE,
          { field, mimeType: file.mimeType }
        )
      }

      if (criteria.extensions) {
        const allowed = criteria.extensions.map((extension) => extension.toLowerCase())
        if (!allowed.includes(file.extension.toLowerCase())) {
          throw new MultipartError(
            `Field "${field}" has unsupported extension: ${file.extension}`,
            ErrorCodes.INVALID_EXTENSION,
            { field, extension: file.extension }
          )
        }
      }

      if (criteria.maxSize && file.size > criteria.maxSize) {
        throw new MultipartError(
          `Field "${field}" exceeds max size of ${criteria.maxSize} bytes`,
          ErrorCodes.LIMIT_FILE_SIZE,
          { field, size: file.size, maxSize: criteria.maxSize }
        )
      }
    }
  }
}
