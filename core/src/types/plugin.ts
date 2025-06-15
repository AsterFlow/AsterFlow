import type { UnionToIntersection } from './utils'

/**
 * Combines the contexts of multiple plugins into a single intersection type.
 * This allows safe access to all properties of the merged plugin contexts.
 */
export type MergedPluginContexts<
  Plugins extends Record<string, { context: any }>
> = UnionToIntersection<Plugins[keyof Plugins]['context']>