import type { MultipartFieldCriteria, MultipartFields, MultipartFile } from './multipart'

type NarrowedFile<Criteria extends MultipartFieldCriteria> =
  Criteria['mimeTypes'] extends readonly (infer M extends string)[]
    ? Omit<MultipartFile, 'mimeType'> & { mimeType: M }
    : MultipartFile

type InferFieldFile<Criteria extends MultipartFieldCriteria> =
  Criteria['required'] extends true ? NarrowedFile<Criteria> : NarrowedFile<Criteria> | undefined

type InferFieldFiles<Criteria extends MultipartFieldCriteria> = NarrowedFile<Criteria>[]

/**
 * `request` extension for a route that called `.multipart(schema)` -
 * `getFile`/`getFiles` keyed to the declared field names, schema-narrowed.
 * `ExtendedRequest` (in `@asterflow/router`) omits the ambient untyped
 * versions before intersecting this in, so this is the only signature
 * available, not an extra overload.
 */
export type InferMultipartRequestFragment<Schema extends MultipartFields> = {
  getFile<K extends keyof Schema & string>(field: K): InferFieldFile<Schema[K]>
  getFiles<K extends keyof Schema & string>(field: K): InferFieldFiles<Schema[K]>
}
