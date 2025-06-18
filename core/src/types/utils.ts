/**
 * Converts a union of types into an intersection of types.
 * Useful for combining properties from multiple types into a single coalesced type.
 */
export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never

export type AnyRecord = Record<string, any>