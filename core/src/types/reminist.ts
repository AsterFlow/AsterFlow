import type { AnyRouter, MethodKeys } from '@asterflow/router'
import type { Reminist } from 'reminist'
import type { RouteEntry } from './routes'

/**
 * Represents a generic Reminist instance, used for managing routes.
 * Includes a record of route entries and an array of HTTP method keys.
 */
export type AnyReminist = Reminist<any, any>

/**
 * Infers the paths from a Reminist instance.
 */
export type InferReministPath<T> = T extends Reminist<infer C, any>
  ? Extract<keyof C, string>[]
  : never

/**
 * Infers the context from a Reminist instance.
 */
export type InferReministContext<T> = T extends Reminist<infer C, any>
  ? C
  : never

/**
 * Reminist context that preserves specific route information.
 * Each path maps to its specific typed route.
 */
export type ReministContext<
  PathsAndRoutes extends Record<string, AnyRouter>
> = {
    readonly [Path in keyof PathsAndRoutes]: RouteEntry<
      Path extends string ? Path : never,
      PathsAndRoutes[Path]
    >
  }