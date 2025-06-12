import type { AnyRouter } from '@asterflow/router'
import type { Reminist } from 'reminist'
import type { RouteEntry } from './routes'

export type InferReministPath<T> = T extends Reminist<infer P, any, any>
  ? P
  : never

export type InferReministContext<T> = T extends Reminist<any, infer C, any>
  ? C
  : never

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