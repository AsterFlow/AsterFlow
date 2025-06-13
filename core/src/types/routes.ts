import type { AnyRouter, MethodKeys } from '@asterflow/router'
import type { CombinePaths, InferPath, NormalizePath } from './paths'
import type { UnionToIntersection } from './utils'

/**
 * Builds the context for a single route, inferring the path and associating the route entry.
 * @template Route - The type of the router (`AnyRouter`).
 * @template Path - The type of the normalized route path string (inferred from `Route`).
 */
export type BuildRouteContext<
  Route extends AnyRouter,
  Path extends string = NormalizePath<InferPath<Route>>
> = {
  readonly [K in Path]: RouteEntry<Path, Route>
} & Record<string, RouteEntry<string, AnyRouter>>

/**
 * Builds the context for multiple routes, combining base paths and inferring route entries.
 * @template Base - The type of the base path string.
 * @template Routes - The type of the array of routers (`readonly AnyRouter[]`).
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
        >
      }
    : never
}[number] & {}> & Record<string, RouteEntry<string, AnyRouter>>

/**
 * Defines the specific typing preserved for each route entry in Reminist.
 * @template Path - The type of the route path string.
 * @template Route - The type of the router associated with the route entry (`AnyRouter`).
 * @property {Path} path - The path of the route.
 * @property {Route} route - The associated route object.
 * @property {readonly MethodKeys[]} methods - An array of HTTP methods supported by the route.
 */
export type RouteEntry<
  Path extends string,
  Route extends AnyRouter
> = {
  readonly path: Path
  readonly route: Route
  readonly methods: readonly MethodKeys[]
}