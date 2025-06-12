/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AnyPluginHooks, Resolver } from '../types/plugin'

/**
 * A factory for creating plugins that can be configured and attached to AsterFlow.
 * Plugins are defined with a series of resolvers (`decorate`, `derive`) and lifecycle
 * hooks (`on`) that build up its context and runtime behavior.
 */
export class Plugin<
  Path extends string,
  Config extends Record<string, any> = {},
  Context extends Record<string, any> = {},
  THooks extends AnyPluginHooks = {}
> {
  public readonly name: Path
  private readonly resolvers: Resolver[]
  public readonly defaultConfig: Partial<Config>
  public readonly hooks: THooks

  private constructor(
    name: Path,
    resolvers: Resolver[],
    hooks: THooks,
    defaultConfig: Partial<Config>
  ) {
    this.name = name
    this.resolvers = resolvers
    this.hooks = hooks
    this.defaultConfig = defaultConfig
  }

  /**
   * Defines the shape of the configuration and its default values for this plugin.
   */
  withConfig<C extends Record<string, any>>(defaultConfig: C) {
    return new Plugin<Path, C, Context, THooks>(
      this.name,
      this.resolvers,
      this.hooks,
      defaultConfig
    )
  }

  /**
   * Adds a new static value to the plugin's context (decoration).
   */
  decorate<Key extends string, Value>(key: Key, value: Value) {
    const resolver: Resolver = (_config, context) => ({
      ...context,
      [key]: value
    })

    return new Plugin<Path, Config, Context & { [K in Key]: Value }, THooks>(
      this.name,
      [...this.resolvers, resolver],
      this.hooks,
      this.defaultConfig
    )
  }

  /**
   * Adds a new property to the context that is derived from the configuration and the existing context.
   * The resolver function is executed lazily when the plugin is registered via `app.use()`.
   */
  derive<Key extends string, Value>(
    key: Key,
    resolverFn: (context: Context & Config) => Value
  ) {
    const resolver: Resolver = (config, context) => {
      const fullContext = { ...context, ...config }
      const derivedValue = resolverFn(fullContext as Context & Config)
      return {
        ...context,
        [key]: derivedValue
      }
    }

    return new Plugin<Path, Config, Context & { [K in Key]: Value }, THooks>(
      this.name,
      [...this.resolvers, resolver],
      this.hooks,
      this.defaultConfig
    )
  }

  /**
   * Registers a handler for a specific lifecycle event.
   * Adding a hook makes the plugin "runtime-aware". AsterFlow can optimize by only
   * invoking plugins that have registered hooks for a given event.
   *
   * @example
   * const routingPlugin = Plugin.create({ name: 'dynamic-routes' })
   * .on('beforeInitialize', (app, context) => {
   * // `app` is the AsterFlow instance
   * const dynamicRouter = createDynamicRouter();
   * app.controller(dynamicRouter);
   * });
   */
  on<
    Event extends keyof AnyPluginHooks,
    Handler extends NonNullable<AnyPluginHooks[Event]> extends (infer F)[] ? F : never
  >(
    event: Event,
    handler: Handler
  ) {
    if (!this.hooks[event]) this.hooks[event] = [];
    (this.hooks[event] as any).push(handler)

    return new Plugin<Path, Config, Context, typeof this.hooks>(
      this.name,
      this.resolvers,
      this.hooks,
      this.defaultConfig
    )
  }

  /**
   * Builds the final context and hooks from the provided configuration.
   */
  _build(config: any) {
    const finalConfig = { ...this.defaultConfig, ...config } as Config

    let context: Record<string, any> = {}
    for (const resolver of this.resolvers) {
      context = resolver(finalConfig, context)
    }

    return {
      name: this.name,
      context: context as Context,
      hooks: this.hooks
    }
  }

  /**
   * Creates a new Plugin instance. This is the entry point for building a plugin.
   */
  public static create<Path extends string>(
    options: { name: Path }
  ): Plugin<Path, {}, {}, {}> {
    return new Plugin(options.name, [], {}, {})
  }
}