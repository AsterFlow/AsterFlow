import type {
  DefaultMethodProps,
  DefaultRouteMethodBuilderProps,
  Method,
  MergeProps,
  MethodProps,
  RouteMethodBuilderProps
} from '@asterflow/router'
import type { InferMultipartRequestFragment } from './inferRequest'
import type { MultipartFields, MultipartFile, MultipartResult } from './multipart'

/**
 * Ambient fallback for routes that don't call `.multipart(...)` - optional,
 * since these only exist on `request` for an actual multipart request.
 * Routes that do call `.multipart(...)` get the stricter, non-optional
 * typing below instead, which wins for `getFile`/`getFiles`.
 */
declare module '@asterflow/request' {
  interface AsterRequest {
    /** Parsed form fields. Only set when the request was `multipart/form-data`. */
    body?: Record<string, string | string[]>
    /** All processed files from the request. Only set when it was `multipart/form-data`. */
    files?: MultipartFile[]
    /** Parsing metadata (timing, counts). Only set when it was `multipart/form-data`. */
    multipartMetadata?: MultipartResult['metadata']

    getFile?(fieldName: string): MultipartFile | undefined
    getFiles?(fieldName?: string): MultipartFile[]
    hasFiles?(): boolean
    getFilesByType?(mimeType: string): MultipartFile[]
    /** Saves every file into `directory`, keyed by original filename. Returns the written paths. */
    saveAll?(directory: string): Promise<string[]>
    /** Removes any temp files created on disk for this request. Safe to call more than once. */
    cleanupMultipart?(): Promise<void>
  }
}

/**
 * Adds `.multipart(schema)` onto `MethodClass` and `RouteMethodBuilder` via
 * declaration merging - the parameter list must match each class's real one
 * exactly (count, constraints, defaults). No `const` modifier here: Bun's
 * transpiler can't parse `const` type parameters inside a merged interface,
 * even though `tsc` accepts it. Runtime implementation lives in
 * `controllers/multipartExtension.ts`.
 */
declare module '@asterflow/router' {
  interface MethodClass<
    Props extends MethodProps = DefaultMethodProps
  > {
    multipart<Fields extends MultipartFields>(
      schema: Fields
    ): Method<MergeProps<Props, { requestExt: Props['requestExt'] & InferMultipartRequestFragment<Fields>, handler: Props['handler'] extends undefined ? undefined : any }>>
  }

  interface RouteMethodBuilder<
    Props extends RouteMethodBuilderProps = DefaultRouteMethodBuilderProps
  > {
    multipart<Fields extends MultipartFields>(
      schema: Fields
    ): RouteMethodBuilder<MergeProps<Props, { requestExt: Props['requestExt'] & InferMultipartRequestFragment<Fields> }>>
  }
}
