import type { Node } from '../controllers/Node'

export type NodeParams<
  Data,
  Path extends string,
  Nodes extends readonly Node<any>[],
  Endpoint extends boolean
> = {
  name: Path
  endpoint: Endpoint,
  store?: Data
  children?: Nodes
}
