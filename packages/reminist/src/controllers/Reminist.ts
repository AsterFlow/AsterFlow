import type { ReministOptions } from '../types/reminist'
import { Node } from './Node'

export class Reminist<
  Data,
  const Keys extends readonly string[] = string[]
>{
  private keys: Keys
  private routers = new Map<Keys[number], Node<Data>>()
  private cache = new Map<Keys[number], Set<string>>()

  constructor(options: ReministOptions<Keys>) {
    this.keys = options.keys
  

    this.keys.forEach((method) => {
      this.routers.set(method, new Node({ name: '/', endpoint: false }))
      this.cache.set(method, new Set())
    })
  }

  getRoot(key: Keys[number]) {
    const root = this.routers.get(key)
    if (!root) throw new Error(`Method ${key} not found!`)

    return root
  }

  getParts(path: string): string[] {
    const parts = path.split(/(\/)/g).filter(Boolean)
    if (parts[0] === '/') parts.shift()
    return parts
  }

  /**
   * Adds a new path to the tree. Marks the final node as an endpoint.
   *
   * @param path - Path string in the format '/part1/part2/...'. Each segment becomes a node.
   * @throws {Error} If trying to add a path that already exists as a final node.
   */
  add(key: Keys[number], path: string, store: Data): void {
    if (this.has(key, path)) {
      throw new Error(`Unable to add path '${path}' because a final node already exists`)
    }

    const parts = this.getParts(path)
    let current = this.getRoot(key)

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]!
      const prefix = part.charAt(0)
      const prefixCode = prefix.charCodeAt(0)
      const node = current.inert.get(prefixCode)

      if (node && node.name === part) {
        current = node
        continue
      }

      if (!node) {
        const newNode = new Node<Data>({ name: part, endpoint: false })
        current.inert.set(prefixCode, newNode)
        current = newNode
      }
    }
    
    current.store = store
    current.endpoint = true
    this.cache.get(key)!.add(path)
  }

  /**
   * Checks whether a path exists in the tree.
   */
  has(key: Keys[number], path: string): boolean {
    return this.cache.get(key)!.has(path)
  }

  /**
   * Retrieves the node corresponding to a path, if it exists and is marked as an endpoint.
   *
   * @param path - Path string in the format '/part1/part2/...'.
   * @returns The node if found and marked as an endpoint; otherwise, undefined.
   */
  find(key: Keys[number], path: string): Node<Data> | null {
    const parts = this.getParts(path)
    let current = this.getRoot(key)
    let depth = 0

    for (const part of parts) {
      depth++
      const prefixCode = part.charAt(0).charCodeAt(0)
      const directChild = current.inert.get(prefixCode)

      if (directChild && directChild.name === part) {
        current = directChild
        continue
      }

      const paramChild = Array.from(current.inert.values()).find(
        (n) => n.name.startsWith(':')
      )

      if (paramChild) {
        current = paramChild
      } else {
        return null
      }
    }

    if (!current.endpoint) return null
    if (parts.length > depth) return null

    return current
  }

  /**
   * Removes a path from the tree. If the final node becomes a leaf, performs backtracking pruning.
   *
   * @param path - Path string in the format '/part1/part2/...'.
   * @returns True if the path was successfully removed, false if it did not exist.
   */
  delete(key: Keys[number], path: string): boolean {
    if (!this.has(key, path)) return false

    const parts = this.getParts(path)
    let current = this.getRoot(key)
    const stacks: Array<{ node: Node<Data>; prefixCode: number }> = []

    // Traverse down, collecting parents
    for (const part of parts) {
      const prefixCode = part.charCodeAt(0)
      const child = current.inert.get(prefixCode)

      if (!child || child.name !== part) return false
  
      stacks.push({ node: current, prefixCode })
      current = child
    }

    if (!current.endpoint) return false

    current.endpoint = false
    current.store = undefined
    
    // Bottom-up loop, removing elements without children
    for (let i = stacks.length - 1; i >= 0; i--) {
      const { node: parent, prefixCode } = stacks[i]!
      const child = parent.inert.get(prefixCode)!

      if (child.inert.size === 0 && !child.endpoint) {
        parent.inert.delete(prefixCode)
      } else {
        break
      }
    }

    this.cache.get(key)!.delete(path)
    return true
  }

  static create<D>() {
    return <const K extends readonly string[]>(opts: { keys: K }) =>
      new Reminist<D, K>(opts)
  }
}