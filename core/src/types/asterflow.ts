import type { AnyAdapter } from '@asterflow/adapter'
import type { AnyAsterflow, AsterFlow } from '../controllers/Asterflow'

export type ExtendedAsterflow<AF extends AnyAsterflow> =
  AF extends AsterFlow<any, any, any, any, infer E>
    ? AF & E
    : AF

/**
 * Defines the options for initializing an AsterFlow instance.
 */
export type AsterFlowOptions<
  Drive extends AnyAdapter
> = { driver?: Drive }