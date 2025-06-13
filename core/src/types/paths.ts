import type { AnyRouter, Method, Router } from '@asterflow/router'

/**
 * Removes the fragment identifier from a URL path.
 * @template Path - The URL path as a string.
 * @example
 * // '/page#about' -> '/page'
 */
type RemoveFragment<Path extends string> = 
  Path extends `${infer CleanPath}#${string}`
    ? CleanPath
    : Path

/**
 * Removes the query string from a URL path.
 * @template Path - The URL path as a string.
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
 * @template Path - The URL path as a string.
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
 * @template Path - The URL path as a string.
 * @example
 * // '/users//:id=number?data=1#profile' -> '/users/:id'
 */
export type NormalizePath<Path extends string> =
  Path extends `${infer Head}//${infer Tail}`
    ? NormalizePath<`${Head}/${Tail}`>
    : SanitizeSegments<RemoveQueryString<RemoveFragment<Path>>>

/**
 * Combines a base path with a relative path and normalizes the result.
 * @template Base - The base path as a string.
 * @template Path - The path to be appended to the base.
 */
export type CombinePaths<
  Base extends string,
  Path extends string
> = NormalizePath<`${Base}${Path}`>

/**
 * Infers the path from a `Router` or `Method` type.
 * This normalizes the path and combines it with the root.
 * @template T - The router or method type from which to infer the path.
 */
export type InferPath<T> = 
  T extends Router<any, infer P, any, any, any, any>
    ? CombinePaths<'/', P>
    : T extends Method<any, infer P, any, any, any, any, any, any>
      ? CombinePaths<'/', P>
      : never

/**
 * Extracts and normalizes the paths from an array of routers (`AnyRouter[]`), combining them with a base path.
 * @template Base - The base path to be prefixed to the router paths.
 * @template Routes - The array of routers from which to extract the paths.
 */
export type ExtractPaths<
  Base extends string,
  Routes extends readonly AnyRouter[]
> = {
  [K in keyof Routes]: Routes[K] extends infer R extends AnyRouter
    ? CombinePaths<Base, InferPath<R>>
    : never
}