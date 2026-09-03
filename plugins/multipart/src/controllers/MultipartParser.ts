import * as busboyNS from 'busboy'
import { randomUUID } from 'crypto'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { dirname, extname, join } from 'path'
import { Readable } from 'stream'
import { finished, pipeline } from 'stream/promises'
import {
  MultipartError,
  ErrorCodes,
  resolveConfig,
  type MultipartConfig,
  type MultipartFile,
  type MultipartFileInfo,
  type MultipartResult,
  type ParserEvents,
  type ResolvedMultipartConfig
} from '../types/multipart'
import { resolveStream } from '../utils/stream'

// `busboy` is a CJS `export =` module (a callable function merged with a
// namespace of types). Depending on the consuming project's `module`/
// `moduleResolution` TS settings, `import * as busboyNS from 'busboy'`
// either resolves directly to that callable, or to a bundler-style
// `{ default: <callable> }` interop wrapper - this normalizes both shapes to
// a single correctly-typed callable, working under either scheme.
type BusboyFactory = (config: busboyNS.BusboyConfig) => busboyNS.Busboy
const busboy = ((busboyNS as unknown as { default?: BusboyFactory }).default
  ?? (busboyNS as unknown as BusboyFactory))

/**
 * The minimal request shape the parser needs. `AsterRequest` satisfies this
 * structurally, so no dependency on `@asterflow/request`'s generics is needed here.
 */
export interface MultipartRequestLike {
  raw: unknown
  getHeaders(): Record<string, string>
}

class ParsedFile implements MultipartFile {
  fieldName: string
  filename: string
  encoding: string
  mimeType: string
  size: number
  extension: string
  buffer?: Buffer
  tempPath?: string

  constructor(data: Omit<MultipartFile, 'toBuffer' | 'save' | 'stream'>) {
    this.fieldName = data.fieldName
    this.filename = data.filename
    this.encoding = data.encoding
    this.mimeType = data.mimeType
    this.size = data.size
    this.extension = data.extension
    this.buffer = data.buffer
    this.tempPath = data.tempPath
  }

  async toBuffer(): Promise<Buffer> {
    if (this.buffer) return this.buffer
    if (this.tempPath) return readFile(this.tempPath)
    throw new Error(`No data available for file "${this.filename}"`)
  }

  async save(path: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true })

    if (this.buffer) {
      await writeFile(path, this.buffer)
      return
    }
    if (this.tempPath) {
      await pipeline(createReadStream(this.tempPath), createWriteStream(path))
      return
    }
    throw new Error(`No data available for file "${this.filename}"`)
  }

  stream(): NodeJS.ReadableStream {
    if (this.buffer) return Readable.from(this.buffer)
    if (this.tempPath) return createReadStream(this.tempPath)
    throw new Error(`No data available for file "${this.filename}"`)
  }
}

export class MultipartParser {
  private readonly config: ResolvedMultipartConfig
  private readonly events: ParserEvents

  constructor(config: MultipartConfig = {}, events: ParserEvents = {}) {
    this.config = resolveConfig(config, config.fileHandling?.tempDir ?? tmpdir())
    this.events = events
  }

  async parse(request: MultipartRequestLike): Promise<MultipartResult> {
    const startedAt = Date.now()
    const stream = resolveStream(request.raw)

    if (!stream) {
      return {
        fields: {},
        files: [],
        metadata: { processingTime: Date.now() - startedAt, totalSize: 0, fieldsCount: 0, filesCount: 0 }
      }
    }

    return new Promise<MultipartResult>((resolve, reject) => {
      let settled = false
      let bytesReceived = 0
      let fieldsCount = 0
      const fields: Record<string, string | string[]> = {}
      const files: MultipartFile[] = []
      const fileTasks: Promise<void>[] = []

      let bb: busboyNS.Busboy
      try {
        bb = busboy({ headers: request.getHeaders(), limits: this.config.limits })
      } catch (error) {
        reject(new MultipartError(
          error instanceof Error ? error.message : 'Failed to initialize the multipart parser',
          ErrorCodes.PARSE_ERROR
        ))
        return
      }

      const fail = (error: unknown) => {
        if (settled) return
        settled = true

        const err = error instanceof MultipartError
          ? error
          : new MultipartError(
            error instanceof Error ? error.message : 'Unknown multipart parsing error',
            ErrorCodes.PARSE_ERROR
          )

        this.events.onError?.(err)
        // Stop our own parsing, but deliberately leave `stream` (the raw
        // request) alone: it shares its socket with the eventual HTTP
        // response on Node/Express, and destroying it here would tear down
        // the connection before that response can be written, surfacing as
        // an ECONNRESET on the client instead of the intended error status.
        stream.unpipe(bb)
        // Deferred: `fail` can be invoked from inside busboy's own internal
        // event-emission stack (e.g. a file's 'limit' event, fired while
        // busboy is mid-parse). Destroying `bb` synchronously there is
        // reentrant and busboy's own cleanup throws as a result; yielding a
        // tick first lets that stack unwind before we tear it down.
        queueMicrotask(() => bb.destroy())
        reject(err)
      }

      bb.on('field', (name, value, info) => {
        if (settled) return

        if (info.valueTruncated) {
          fail(new MultipartError(`Field "${name}" exceeds the configured size limit`, ErrorCodes.LIMIT_FIELD_SIZE))
          return
        }

        this.events.onField?.(name, value)

        const existing = fields[name]
        fields[name] = existing === undefined
          ? value
          : Array.isArray(existing) ? [...existing, value] : [existing, value]

        fieldsCount++
      })

      bb.on('file', (name, fileStream, info) => {
        if (settled) {
          fileStream.resume()
          return
        }

        const task = this.consumeFile(name, fileStream, info, fail, (chunk) => {
          bytesReceived += chunk.length
          this.events.onProgress?.(bytesReceived)
        })
          .then((file) => {
            if (settled || !file) return
            files.push(file)
            this.events.onFileEnd?.(file)
          })
          .catch((error) => fail(error))

        fileTasks.push(task)
      })

      bb.on('partsLimit', () => fail(new MultipartError('Parts limit exceeded', ErrorCodes.LIMIT_PARTS)))
      bb.on('filesLimit', () => fail(new MultipartError('Files limit exceeded', ErrorCodes.LIMIT_FILE_COUNT)))
      bb.on('fieldsLimit', () => fail(new MultipartError('Fields limit exceeded', ErrorCodes.LIMIT_FIELD_COUNT)))
      bb.on('error', (error) => fail(error))
      stream.on('error', (error) => fail(error))

      bb.on('close', async () => {
        try {
          await Promise.all(fileTasks)
        } catch {
          return // fail() already rejected the outer promise
        }

        if (settled) return
        settled = true

        resolve({
          fields,
          files,
          metadata: {
            processingTime: Date.now() - startedAt,
            totalSize: bytesReceived,
            fieldsCount,
            filesCount: files.length
          }
        })
      })

      stream.pipe(bb)
    })
  }

  private async consumeFile(
    fieldName: string,
    fileStream: NodeJS.ReadableStream & { truncated?: boolean },
    info: { filename: string; encoding: string; mimeType: string },
    fail: (error: unknown) => void,
    onChunk: (chunk: Buffer) => void
  ): Promise<MultipartFile | null> {
    const fileInfo: MultipartFileInfo = {
      fieldName,
      filename: info.filename || 'unknown',
      encoding: info.encoding,
      mimeType: info.mimeType
    }

    // Busboy tracks the fileSize limit internally as bytes arrive and can
    // emit 'limit' independently of whether/when we've attached a consumer.
    // `validateFile` below is `async` and therefore always yields at least
    // one microtask turn - attaching this listener before that await is
    // what guarantees we never miss an early 'limit' event for a small file
    // that busboy finishes flushing during that yield.
    let limitExceeded = false
    fileStream.once('limit', () => {
      limitExceeded = true
      fail(new MultipartError(`File "${fileInfo.filename}" exceeds the configured size limit`, ErrorCodes.LIMIT_FILE_SIZE))
    })
    // Busboy destroys the file stream with an error as part of truncating it
    // on 'limit' (and on other internal parse failures); without a listener
    // here that destroy's 'error' event has nowhere to go and crashes the
    // process instead of being handled by `fail`.
    fileStream.on('error', (error) => fail(error))

    const validation = await this.validateFile(fileInfo)
    if (!validation.valid) {
      fileStream.resume()
      fail(validation.error)
      return null
    }

    this.events.onFileStart?.(fileInfo)

    let size = 0
    const extension = extname(fileInfo.filename)
    const countBytes = (chunk: Buffer) => {
      size += chunk.length
      onChunk(chunk)
      this.events.onFileData?.(fileInfo, chunk)
    }

    try {
      if (this.config.fileHandling.keepInMemory) {
        const chunks: Buffer[] = []
        fileStream.on('data', (chunk: Buffer) => {
          countBytes(chunk)
          chunks.push(chunk)
        })
        await finished(fileStream)

        if (limitExceeded) return null
        return new ParsedFile({ ...fileInfo, size, extension, buffer: Buffer.concat(chunks) })
      }

      await mkdir(this.config.fileHandling.tempDir, { recursive: true })
      const tempPath = join(this.config.fileHandling.tempDir, `multipart-${randomUUID()}${extension}`)

      // The `data` listener and `pipeline()` are wired up back-to-back with
      // no `await` between them (the `mkdir` above already happened) so the
      // stream can't drain to a lone byte-counting listener before the real
      // write destination is attached - that race previously produced
      // empty files on disk.
      fileStream.on('data', countBytes)
      await pipeline(fileStream as NodeJS.ReadableStream, createWriteStream(tempPath))

      if (limitExceeded) return null
      return new ParsedFile({ ...fileInfo, size, extension, tempPath })
    } catch (error) {
      if (!limitExceeded) fail(error)
      return null
    }
  }

  private async validateFile(file: MultipartFileInfo): Promise<{ valid: true } | { valid: false; error: MultipartError }> {
    const { validation } = this.config

    if (validation.allowedMimeTypes && validation.allowedMimeTypes.length > 0 && !validation.allowedMimeTypes.includes(file.mimeType)) {
      return {
        valid: false,
        error: new MultipartError(`MIME type "${file.mimeType}" is not allowed`, ErrorCodes.INVALID_MIME_TYPE)
      }
    }

    if (validation.allowedExtensions && validation.allowedExtensions.length > 0) {
      const ext = extname(file.filename).toLowerCase()
      if (!validation.allowedExtensions.some((allowed) => allowed.toLowerCase() === ext)) {
        return {
          valid: false,
          error: new MultipartError(`Extension "${ext}" is not allowed`, ErrorCodes.INVALID_EXTENSION)
        }
      }
    }

    if (validation.validator) {
      try {
        const isValid = await validation.validator(file)
        if (!isValid) {
          return {
            valid: false,
            error: new MultipartError(`File "${file.filename}" failed custom validation`, ErrorCodes.VALIDATION_FAILED)
          }
        }
      } catch (error) {
        return {
          valid: false,
          error: new MultipartError(
            `Validator threw an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ErrorCodes.VALIDATION_FAILED
          )
        }
      }
    }

    return { valid: true }
  }
}

export async function parseMultipart(
  request: MultipartRequestLike,
  config?: MultipartConfig,
  events?: ParserEvents
): Promise<MultipartResult> {
  return new MultipartParser(config, events).parse(request)
}
