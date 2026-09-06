import type { MethodKeys } from '@asterflow/router'
import type { Reminist } from 'reminist'

/**
 * Represents a generic Reminist instance, used for managing routes.
 * Includes a record of route entries and an array of HTTP method keys.
 */
export type AnyReminist = Reminist<any, any>

/**
 * The `Routers` type param's actual starting value for a fresh `AsterFlow`
 * instance (before any `.method()`/`.router()` call). Deliberately NOT
 * `AnyReminist`: a bare `any` context here makes
 * `InferReministContext<Routers> extends Record<...> ? A : B` (used by
 * `.method()`/`.router()`/`.controller()`/`.middleware()`'s return type)
 * collapse to `any` - TS special-cases a naked `any` in a conditional
 * type's checked position to `A | B`, and `any & X` is `any`, so the whole
 * union collapses back to `any`. An empty, concrete context sidesteps that.
 */
export type DefaultReminist = Reminist<{}, MethodKeys[]>

/**
 * Infers the context from a Reminist instance.
 */
export type InferReministContext<T> = T extends Reminist<infer C, any>
  ? C
  : never