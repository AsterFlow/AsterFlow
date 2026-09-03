import type { Runtime } from '@asterflow/adapter'
import type {
  AnySchema,
  Middleware,
  MethodHandler,
  MethodKeys,
  MiddlewareOutput,
  SchemaDynamic
} from '@asterflow/router'
import type { Responders } from '@asterflow/response'
import type { AnyAsterflow } from 'asterflow'
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
 * Adds `.multipart(schema)` onto `Method` and `RouteMethodBuilder` via
 * declaration merging - the parameter list must match each class's real one
 * exactly (count, constraints, defaults). No `const` modifier here: Bun's
 * transpiler can't parse `const` type parameters inside a merged interface,
 * even though `tsc` accepts it. Runtime implementation lives in
 * `controllers/multipartExtension.ts`.
 */
declare module '@asterflow/router' {
  interface Method<
    Responder extends Responders,
    Path extends string = string,
    Drive extends Runtime = Runtime,
    MethodKey extends MethodKeys = MethodKeys,
    Schema extends AnySchema = AnySchema,
    Middlewares extends readonly Middleware<Responder, Schema, string, Record<string, unknown>>[] = [],
    Context extends MiddlewareOutput<Middlewares> = MiddlewareOutput<Middlewares>,
    Instance extends AnyAsterflow = AnyAsterflow,
    RequestExt extends Record<string, unknown> = {},
    Handler extends MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, RequestExt> | undefined
      = MethodHandler<Path, Drive, Responder, Schema, Middlewares, Context, Instance, RequestExt>,
  > {
    multipart<Fields extends MultipartFields>(
      schema: Fields
    ): Method<Responder, Path, Drive, MethodKey, Schema, Middlewares, Context, Instance, RequestExt & InferMultipartRequestFragment<Fields>, Handler extends undefined ? undefined : any>
  }

  interface RouteMethodBuilder<
    Responder extends Responders,
    Path extends string,
    MethodKey extends MethodKeys,
    Schema extends SchemaDynamic<MethodKey>,
    Context,
    RequestExt extends Record<string, unknown> = {},
  > {
    multipart<Fields extends MultipartFields>(
      schema: Fields
    ): RouteMethodBuilder<Responder, Path, MethodKey, Schema, Context, RequestExt & InferMultipartRequestFragment<Fields>>
  }
}
