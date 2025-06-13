import type { Adapter, Runtime } from '@asterflow/adapter'
import type { AsterFlow } from '../controllers/Asterflow'

/**
 * Represents a generic AsterFlow instance, with all its types defined as `any`.
 * This allows flexibility when referencing AsterFlow without specifying all its type parameters.
 */
export type AnyAsterflow = AsterFlow<any, any, any, any, any>

/**
 * Defines the options for initializing an AsterFlow instance.
 * @template Drive - The type of the driver/adapter to be used (default: `Adapter<Runtime.Node>`).
 * @property {Drive} [driver] - The driver/adapter to handle requests, such as `@asterflow/adapter`.
 */
export type AsterFlowOptions<Drive extends Adapter<Runtime> = Adapter<Runtime.Node>> = {
  driver?: Drive
}