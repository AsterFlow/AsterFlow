import type { AnyRouter, Method, MethodKeys, Router } from '@asterflow/router'
import type { Reminist } from 'reminist'

/**
 * Removes the fragment identifier from a URL path.
 * @example
 * // '/page#about' -> '/page'
 */
type RemoveFragment<Path extends string> = 
  Path extends `${infer CleanPath}#${string}` ? CleanPath : Path;

/**
 * Removes the query string from a URL path.
 * @example
 * // '/users?data=1' -> '/users'
 */
type RemoveQueryString<Path extends string> = 
  Path extends `${infer CleanPath}?${string}` ? CleanPath : Path;

/**
 * Removes type definitions from path segments.
 * It recursively processes the path to clean parts like '=number'.
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
        : Path;

export type Tuple<T extends readonly any[]> = readonly [...T]

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

export type CombinePaths<
  Base extends string,
  Path extends string
> = NormalizePath<`${Base}${Path}`>

/**
 * Tipagem específica preservada para cada rota
 */
export type RouteEntry<
  Path extends string,
  Route extends AnyRouter
> = {
  readonly path: Path;
  readonly route: Route;
  readonly methods: readonly MethodKeys[]
}

/**
 * Context do Reminist que preserva informações específicas das rotas
 * Cada path mapeia para sua rota específica tipada
 */
export type ReministContext<
  PathsAndRoutes extends Record<string, AnyRouter>
> = {
  readonly [Path in keyof PathsAndRoutes]: RouteEntry<
    Path extends string ? Path : never,
    PathsAndRoutes[Path]
  >
}

/**
 * Constrói contexto para uma única rota
 */
export type BuildRouteContext<
  Route extends AnyRouter,
  Path extends string = NormalizePath<InferPath<Route>>
> = {
  readonly [K in Path]: RouteEntry<Path, Route>
} & Record<string, RouteEntry<string, AnyRouter>>;

/**
 * Constrói contexto para múltiplas rotas
 */
export type BuildRoutesContext<
  Base extends string,
  Routes extends readonly AnyRouter[]
> = UnionToIntersection<{
  [K in keyof Routes]: Routes[K] extends AnyRouter
    ? {
        readonly [P in CombinePaths<Base, InferPath<Routes[K]>>]: RouteEntry<
          CombinePaths<Base, InferPath<Routes[K]>>,
          Routes[K]
        >;
      }
    : never;
}[number] & {}> & Record<string, RouteEntry<string, AnyRouter>>;

/**
 * Mescla contextos preservando tipagem
 */
export type MergeContexts<T, U> = T & U

/**
 * Extrai paths de um contexto
 */
export type ContextPaths<T> = T extends Record<infer P, any> ? readonly (P extends string ? P : never)[] : readonly []

export type InferPath<T> = 
  T extends Router<any, infer P, any, any, any, any> ? CombinePaths<'/', P> :
  T extends Method<any, infer P, any, any, any, any, any> ? CombinePaths<'/', P> :
  never

export type InferReministPath<T> = T extends Reminist<infer P, any, any>
  ? P
  : never

export type InferReministContext<T> = T extends Reminist<any, infer C, any>
  ? C
  : never

export type ExtractPaths<
  Base extends string,
  Routes extends readonly AnyRouter[]
> = {
  [K in keyof Routes]: Routes[K] extends infer R extends AnyRouter
    ? CombinePaths<Base, InferPath<R>>
    : never
}

type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;