import type { NodeParams } from '../types/node'

export class Node<
  Data,
  const Path extends string = string,
  const Nodes extends readonly Node<any>[] = [],
  const Endpoint extends boolean = boolean
>{
  name: Path
  store?: Data
  endpoint: Endpoint
  inert: Map<number, Node<Data>> = new Map<number, Node<Data>>()

  constructor (params: NodeParams<Data, Path, Nodes, Endpoint>) {
    if (params.name.length <= 0) throw new Error('Name is empty')

    this.name = params.name
    this.endpoint = params.endpoint
    this.store = params.store
  }
}