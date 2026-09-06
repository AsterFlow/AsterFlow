/**
 * Out-of-band storage for whatever plugins stash via `RouterBuilder`'s
 * per-method `extend(..., runtimeData)`. Deliberately generic (a
 * plain `Record<string, unknown>` bag, not typed per-plugin) - router itself
 * has no knowledge of what any given plugin puts here; it only provides the
 * storage and retrieval primitives every plugin shares.
 *
 * `Method` doesn't use this anymore - it carries its own plugin
 * registrations directly as an instance field (`Method#extensions`), since
 * the object a plugin's chain method mutates via `extend` already
 * *is* the finished route. This registry now exists solely for `Router`
 * (built via `RouterBuilder`, which extends `Router`), where one router
 * instance holds independent registrations per HTTP method, keyed by that
 * same instance, since that's what a plugin's `onRequest` hook actually has
 * access to at request time (via the matched route entry).
 */
const registry = new WeakMap<object, Record<string, unknown>>()

/** Called by `RouterBuilder.method(...)` each time a method registers plugin data. */
export function setRouteExtensions(route: object, extensions: Record<string, unknown>): void {
  if (Object.keys(extensions).length === 0) return
  registry.set(route, extensions)
}

/**
 * Reads back whatever a plugin stashed for this router, e.g.
 * `getRouteExtensions(router)?.post?.multipart`. Returns `undefined` for
 * routers built without `RouterBuilder` (`new Router({...})`) or that never
 * called any extension method. `Method` routes never go through here - see
 * `Method#extensions` instead.
 */
export function getRouteExtensions(route: object): Record<string, unknown> | undefined {
  return registry.get(route)
}
