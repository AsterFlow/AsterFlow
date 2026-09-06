import type { Method, MethodProps, Router, RouterProps } from '@asterflow/router'
import type { NormalizePath } from '@asterflow/url-parser'

/**
 * Combines a base path with a relative path and normalizes the result.
 */
export type CombinePaths<
  Base extends string,
  Path extends string
> = NormalizePath<`${Base}${Path}`>

/**
 * Infers the path from a `Router` or `Method` type.
 * This normalizes the path and combines it with the root.
 */
export type InferPath<T> =
  T extends Router<infer Props extends RouterProps>
    ? CombinePaths<'/', Props['path']>
    : T extends Method<infer Props extends MethodProps>
      ? CombinePaths<'/', Props['path']>
      : never
