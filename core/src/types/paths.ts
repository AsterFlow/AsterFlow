import type { AnyRouter, Method, Router } from '@asterflow/router'

/**
 * Removes the fragment identifier from a URL path.
 * @example
 * // '/page#about' -> '/page'
 */
type RemoveFragment<Path extends string> = 
  Path extends `${infer CleanPath}#${string}`
    ? CleanPath
    : Path

/**
 * Removes the query string from a URL path.
 * @example
 * // '/users?data=1' -> '/users'
 */
type RemoveQueryString<Path extends string> = 
  Path extends `${infer CleanPath}?${string}`
    ? CleanPath
    : Path

/**
 * Removes type definitions from path segments.
 * Recursively processes the path to clean parts like '=number'.
 * @example
 * // '/users/:id=number' -> '/users/:id'
 */
type SanitizeSegments<Path extends string> =
  Path extends `/${infer Rest}`
    ? `/${SanitizeSegments<Rest>}`
    : Path extends `${infer Segment}/${infer Rest}`
      ? `${(Segment extends `${infer Name}=${string}` ? Name : Segment)}/${SanitizeSegments<Rest>}`
      : Path extends `${infer Name}=${string}`
        ? Name
        : Path

/**
 * Normalizes a URL path by performing several cleaning operations:
 * 1. Replaces double slashes ('//') with a single slash.
 * 2. Removes the URL fragment (e.g., '#about').
 * 3. Removes the query string (e.g., '?data=1').
 * 4. Removes type definitions from path segments (e.g., ':id=number' -> ':id').
 * @example
 * // '/users//:id=number?data=1#profile' -> '/users/:id'
 */
export type NormalizePath<Path extends string> =
  Path extends `${infer Head}//${infer Tail}`
    ? NormalizePath<`${Head}/${Tail}`>
    : SanitizeSegments<RemoveQueryString<RemoveFragment<Path>>>

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