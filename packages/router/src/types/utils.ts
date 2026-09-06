export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/**
 * Produces a new `Props` object type equal to `Props` with `Patch`'s keys
 * overridden. Lets a fluent builder method name only the field(s) actually
 * changing instead of respelling every unchanged generic slot.
 */
export type MergeProps<Props, Patch> = Prettify<Omit<Props, keyof Patch> & Patch>
