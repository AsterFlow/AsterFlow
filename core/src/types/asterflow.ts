import type { Adapter, Runtime } from '@asterflow/adapter'
import type { AsterFlow } from '../controllers/Asterflow'

/**
 * Represents a generic AsterFlow instance, with all its types defined as `any`.
 * This allows flexibility when referencing AsterFlow without specifying all its type parameters.
 */
export type AnyAsterflow = AsterFlow<any, any, any, any, any>
export type ExtendedAsterflow<AF extends AnyAsterflow> =
  AF extends AsterFlow<any, any, any, any, infer E>
    ? AF & E
    : AF

/**
 * Defines the options for initializing an AsterFlow instance.
 */
export type AsterFlowOptions<
  Drive extends Adapter<Runtime> = Adapter<Runtime.Node>
> = {
  driver?: Drive
}