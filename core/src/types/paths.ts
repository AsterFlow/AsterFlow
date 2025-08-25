import type { AnyRouter, Method, Router } from '@asterflow/router'
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
  T extends Router<any, infer P, any, any, any, any>
    ? CombinePaths<'/', P>
    : T extends Method<any, infer P, any, any, any, any, any, any, any>
      ? CombinePaths<'/', P>
      : never

/**
 * Extracts and normalizes the paths from an array of routers (`AnyRouter[]`), combining them with a base path.
 */
export type ExtractPaths<
  Base extends string,
  Routes extends readonly AnyRouter[]
> = {
  [K in keyof Routes]: Routes[K] extends infer R extends AnyRouter
    ? CombinePaths<Base, InferPath<R>>
    : never
}