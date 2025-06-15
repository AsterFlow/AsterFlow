import type { AnyRouter, MethodKeys } from '@asterflow/router'
import type { CombinePaths, InferPath, NormalizePath } from './paths'
import type { UnionToIntersection } from './utils'

/**
 * Builds the context for a single route, inferring the path and associating the route entry.
 */
export type BuildRouteContext<
  Route extends AnyRouter,
  Path extends string = NormalizePath<InferPath<Route>>
> = {
  readonly [K in Path]: RouteEntry<Path, Route>
} & Record<string, RouteEntry<string, AnyRouter>>

/**
 * Builds the context for multiple routes, combining base paths and inferring route entries.
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
 */
export type RouteEntry<
  Path extends string,
  Route extends AnyRouter
> = {
  readonly path: Path
  readonly route: Route
  readonly methods: readonly MethodKeys[]
}