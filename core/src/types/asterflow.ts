import type { Adapter, Runtime } from '@asterflow/adapter'

export type AsterFlowOptions<
  Drive extends Adapter<Runtime> = Adapter<Runtime.Node>
>= {
  driver?: Drive
}