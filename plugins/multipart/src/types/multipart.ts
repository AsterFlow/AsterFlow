import type { MethodKeys } from '@asterflow/router'
import type { MimeType } from './mime'

/** Per-field upload criteria declared on a route's `multipart` option. */
export interface MultipartFieldCriteria {
  /** Allowed MIME types for this field's file(s). */
  mimeTypes?: readonly MimeType[]
  /** Allowed file extensions, e.g. ['.png', '.jpg']. */
  extensions?: readonly string[]
  /** Maximum file size in bytes. */
  maxSize?: number
  /** Whether this field must be present. Defaults to false. */
  required?: boolean
  /** Whether this field accepts more than one file. Defaults to false. */
  multiple?: boolean
}

/** A route's full multipart schema: field name -> criteria. */
export type MultipartFields = Record<string, MultipartFieldCriteria>
/** A router's multipart schema, keyed per HTTP method. */
export type MultipartFieldsDynamic<M extends MethodKeys = MethodKeys> = { [K in M]?: MultipartFields }

/**
 * Limits enforced by busboy while parsing a multipart request.
 */
export interface MultipartLimits {
  /** Maximum field name size in bytes (default: 100) */
  fieldNameSize?: number
  /** Maximum field value size in bytes (default: 1MB) */
  fieldSize?: number
  /** Maximum number of non-file fields (default: Infinity) */
  fields?: number
  /** Maximum file size in bytes (default: 10MB) */
  fileSize?: number
  /** Maximum number of files (default: 10) */
  files?: number
  /** Maximum number of parts, fields + files (default: Infinity) */
  parts?: number
}

/**
 * Controls where uploaded file contents are stored while being parsed.
 */
export interface MultipartFileHandling {
  /** Keep file contents in memory as a Buffer (default: true) */
  keepInMemory?: boolean
  /** Directory used to store files on disk when `keepInMemory` is false (default: os.tmpdir()) */
  tempDir?: string
}

/**
 * Validation rules applied to every incoming file, before its stream is consumed.
 */
export interface MultipartValidation {
  /** Allowed MIME types. Empty/undefined means any type is allowed. */
  allowedMimeTypes?: string[]
  /** Allowed file extensions (e.g. ".png"). Empty/undefined means any extension is allowed. */
  allowedExtensions?: string[]
  /** Custom validation function, run after the built-in checks. */
  validator?: (file: MultipartFileInfo) => boolean | Promise<boolean>
}

export interface MultipartConfig {
  limits?: MultipartLimits
  fileHandling?: MultipartFileHandling
  validation?: MultipartValidation
}

export type ResolvedMultipartConfig = Required<{
  limits: Required<MultipartLimits>
  fileHandling: Required<MultipartFileHandling>
  validation: MultipartValidation
}>

export const DEFAULT_CONFIG: MultipartConfig = {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024, // 1MB
    fields: Infinity,
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
    parts: Infinity
  },
  fileHandling: {
    keepInMemory: true
    // tempDir defaults to os.tmpdir(), resolved lazily in resolveConfig
  },
  validation: {
    allowedMimeTypes: [],
    allowedExtensions: []
  }
}

export function resolveConfig(config: MultipartConfig, tempDir: string): ResolvedMultipartConfig {
  return {
    limits: {
      ...DEFAULT_CONFIG.limits,
      ...config.limits
    } as Required<MultipartLimits>,
    fileHandling: {
      keepInMemory: true,
      tempDir,
      ...config.fileHandling
    } as Required<MultipartFileHandling>,
    validation: {
      ...DEFAULT_CONFIG.validation,
      ...config.validation
    }
  }
}

/**
 * Metadata about a file part, known before its contents have been read.
 * This is what validators and the `onFileStart` event receive.
 */
export interface MultipartFileInfo {
  /** Field name in the form */
  fieldName: string
  /** Original filename */
  filename: string
  /** Content-Transfer-Encoding of the part */
  encoding: string
  /** MIME type of the part */
  mimeType: string
}

/**
 * A fully processed file: the result of parsing a multipart request.
 */
export interface MultipartFile {
  /** Field name in the form */
  fieldName: string
  /** Original filename */
  filename: string
  /** Content-Transfer-Encoding of the part */
  encoding: string
  /** MIME type of the part */
  mimeType: string
  /** File size in bytes */
  size: number
  /** File extension, including the leading dot (e.g. ".png") */
  extension: string
  /** In-memory contents, set when `keepInMemory` is true */
  buffer?: Buffer
  /** Path to the file on disk, set when `keepInMemory` is false */
  tempPath?: string

  /** Reads the full file contents into memory, regardless of storage mode. */
  toBuffer(): Promise<Buffer>
  /** Copies the file to `path`, creating parent directories as needed. */
  save(path: string): Promise<void>
  /** Returns a fresh readable stream over the file contents. */
  stream(): NodeJS.ReadableStream
}

export interface MultipartResult {
  /** Text fields from the form. Repeated field names become string arrays. */
  fields: Record<string, string | string[]>
  /** Processed files */
  files: MultipartFile[]
  metadata: {
    /** Total processing time in ms */
    processingTime: number
    /** Total bytes read across all files */
    totalSize: number
    /** Number of fields parsed */
    fieldsCount: number
    /** Number of files parsed */
    filesCount: number
  }
}

/**
 * Hooks into the parsing lifecycle, usable both through the plugin config and
 * when driving `MultipartParser` directly.
 */
export interface ParserEvents {
  onField?: (fieldName: string, value: string) => void
  onFileStart?: (file: MultipartFileInfo) => void
  onFileData?: (file: MultipartFileInfo, chunk: Buffer) => void
  onFileEnd?: (file: MultipartFile) => void
  onProgress?: (bytesReceived: number) => void
  onError?: (error: Error) => void
}

export const ErrorCodes = {
  LIMIT_FILE_SIZE: 'LIMIT_FILE_SIZE',
  LIMIT_FILE_COUNT: 'LIMIT_FILE_COUNT',
  LIMIT_FIELD_SIZE: 'LIMIT_FIELD_SIZE',
  LIMIT_FIELD_COUNT: 'LIMIT_FIELD_COUNT',
  LIMIT_PARTS: 'LIMIT_PARTS',
  INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
  INVALID_EXTENSION: 'INVALID_EXTENSION',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  FIELD_REQUIRED: 'FIELD_REQUIRED',
  FIELD_TOO_MANY_FILES: 'FIELD_TOO_MANY_FILES',
  PARSE_ERROR: 'PARSE_ERROR'
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

export class MultipartError extends Error {
  code: ErrorCode
  details?: unknown

  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message)
    this.name = 'MultipartError'
    this.code = code
    this.details = details
  }
}
