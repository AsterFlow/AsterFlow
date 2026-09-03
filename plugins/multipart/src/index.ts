import { Plugin } from '@asterflow/plugin'
import { getRouteExtensions, Method, type MethodKeys } from '@asterflow/router'
import { unlink } from 'fs/promises'
import { tmpdir } from 'os'
import * as pkg from '../package.json'
import { installExtension } from './controllers/multipartExtension'
import { validateFields } from './controllers/validateMultipartFields'
import { parseMultipart } from './controllers/MultipartParser'
import './types/asterflow.d.ts'
import {
  DEFAULT_CONFIG,
  MultipartError,
  ErrorCodes,
  resolveConfig,
  type MultipartConfig,
  type MultipartFields,
  type MultipartFile,
  type MultipartResult
} from './types/multipart'
import { errorResponse } from './utils/errors'
import { debug, logError } from './utils/log'

export * from './controllers/MultipartParser'
export * from './controllers/validateMultipartFields'
export * from './types/inferRequest'
export * from './types/mime'
export * from './types/multipart'
export * from './utils/errors'

function buildExtras(result: MultipartResult) {
  return {
    body: result.fields,
    files: result.files,
    multipartMetadata: result.metadata,

    getFile(fieldName: string): MultipartFile | undefined {
      return result.files.find((file) => file.fieldName === fieldName)
    },
    getFiles(fieldName?: string): MultipartFile[] {
      return fieldName ? result.files.filter((file) => file.fieldName === fieldName) : result.files
    },
    hasFiles(): boolean {
      return result.files.length > 0
    },
    getFilesByType(mimeType: string): MultipartFile[] {
      return result.files.filter((file) => file.mimeType === mimeType)
    },
    async saveAll(directory: string): Promise<string[]> {
      const paths: string[] = []
      for (const file of result.files) {
        const path = `${directory}/${file.filename}`
        await file.save(path)
        paths.push(path)
      }
      return paths
    },
    async cleanupMultipart(): Promise<void> {
      await Promise.all(result.files.map(async (file) => {
        if (!file.tempPath) return
        try {
          await unlink(file.tempPath)
        } catch {}
      }))
    }
  }
}

export const multipartPlugin = Plugin
  .create({ name: 'multipart' })
  .decorate('creator', 'Ashu11-A')
  .decorate('version', pkg.version)
  .decorate('installed', installExtension())
  // `.config()` doesn't actually flatten defaults into the plugin context at
  // runtime - kept only for `InferConfigArgument` typing. Real default-filling
  // happens in `resolveConfig` below.
  .config<MultipartConfig>(DEFAULT_CONFIG)
  .on('onRequest', async ({ request, response, router, plugin }) => {
    const method = request.getMethod().toLowerCase() as MethodKeys
    const schema: MultipartFields | undefined = router.route instanceof Method
      ? router.route.extensions.multipart as MultipartFields | undefined
      : (getRouteExtensions(router.route) as Record<MethodKeys, Record<string, unknown> | undefined> | undefined)?.[method]?.multipart as MultipartFields | undefined

    const contentType = request.getHeaders()['content-type']
    const isMultipart = !!contentType && contentType.toLowerCase().includes('multipart/form-data')

    if (!isMultipart) {
      // A declared schema types getFile/getFiles as always-present, so reject
      // up front rather than let the handler run against a non-multipart body.
      if (schema) {
        return errorResponse(response, new MultipartError(
          'Expected a multipart/form-data request', ErrorCodes.PARSE_ERROR
        ))
      }
      return
    }

    try {
      const config = resolveConfig(plugin.context as MultipartConfig, tmpdir())
      const result = await parseMultipart(request, config)

      if (schema) validateFields(result, schema)

      debug('Multipart request parsed', {
        Fields: String(result.metadata.fieldsCount),
        Files: String(result.metadata.filesCount),
        'Total Size': `${result.metadata.totalSize} bytes`,
        'Processing Time': `${result.metadata.processingTime}ms`
      })

      request.extend(buildExtras(result))
    } catch (error) {
      const multipartError = error instanceof MultipartError
        ? error
        : new MultipartError(error instanceof Error ? error.message : 'Unknown error', ErrorCodes.PARSE_ERROR)

      logError('Failed to parse multipart request', multipartError)

      return errorResponse(response, multipartError)
    }
  })
  .on('onResponse', async ({ request }) => {
    await (request as unknown as { cleanupMultipart?: () => Promise<void> }).cleanupMultipart?.()
  })

export default multipartPlugin
