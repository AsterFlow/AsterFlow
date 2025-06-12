import type { UnionToIntersection } from './utils'

export type MergedPluginContexts<
  Plugins extends Record<string, { context: any }>
> = UnionToIntersection<Plugins[keyof Plugins]['context']>