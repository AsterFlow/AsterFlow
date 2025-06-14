 
import type { AnyAsterflow, ExtendedAsterflow } from '@asterflow/core'
import type { PluginHooks, Resolver } from '../types/plugin'

/**
 * A factory for creating plugins that can be configured and attached to AsterFlow.
 * Plugins are defined with a series of resolvers (`decorate`, `derive`) and lifecycle
 * hooks (`on`) that build up its context and runtime behavior.
 */
export class Plugin<
  Path extends string,
  Instance extends AnyAsterflow,
  Config extends Record<string, any> = {},
  Context extends Record<string, any> = {},
  Hooks extends PluginHooks<any, Context[], any> = {},
  Extension extends Record<string, any> = {}
> {
  public readonly name: Path
  private readonly resolvers: Resolver[]
  public readonly defaultConfig: Partial<Config>
  public readonly hooks: Hooks
  public instance!: Instance
  private readonly _extensionFn?: (app: Instance, context: Context) => Extension

  private constructor(
    name: Path,
    resolvers: Resolver[],
    hooks: Hooks,
    defaultConfig: Partial<Config>,
    extensionFn?: (app: Instance, context: Context) => Extension
  ) {
    this.name = name
    this.resolvers = resolvers
    this.hooks = hooks
    this.defaultConfig = defaultConfig
    this._extensionFn = extensionFn
  }

  /**
   * Defines the shape of the configuration and its default values for this plugin.
   */
  config<C extends Record<string, any>>(defaultConfig: C) {
    return new Plugin<Path, Instance, C, Context, Hooks, Extension>(
      this.name,
      this.resolvers,
      this.hooks,
      defaultConfig,
      this._extensionFn
    )
  }
  
  /**
   * O `defineInstance` agora é mais simples. Ele não precisa mais re-tipar
   * a classe inteira. Ele só serve para passar o `this` para o `_build`.
   */
  defineInstance<Instanced extends AnyAsterflow>(instance: Instanced) {
    this.instance = instance as any
    return this
  }

  /**
   * Adds a new static value to the plugin's context (decoration).
   */
  decorate<Key extends string, Value>(key: Key, value: Value) {
    const resolver: Resolver = async (_config, context) => ({
      ...context,
      [key]: value
    })

    return new Plugin<Path, Instance, Config, Context & { [K in Key]: Value }, Hooks, Extension>(
      this.name,
      [...this.resolvers, resolver],
      this.hooks,
      this.defaultConfig,
      this._extensionFn
    )
  }

  /**
   * Adds a new property to the context that is derived from the configuration and the existing context.
   * The resolver function is executed lazily when the plugin is registered via `app.use()`.
   */
  derive<Key extends string, Value>(
    key: Key,
    resolverFn: (context: Context & Config) => Value | Promise<Value>
  ) {
    const resolver: Resolver = async (config, context) => {
      const fullContext = { ...context, ...config }
      const derivedValue = await resolverFn(fullContext as Context & Config)
      return {
        ...context,
        [key]: derivedValue
      }
    }

    return new Plugin<Path, Instance, Config, Context & { [K in Key]: Awaited<Value> }, Hooks, Extension>(
      this.name,
      [...this.resolvers, resolver],
      this.hooks,
      this.defaultConfig,
      this._extensionFn
    )
  }

  /**
   * Registers a handler for a specific lifecycle event.
   * Adding a hook makes the plugin "runtime-aware". AsterFlow can optimize by only
   * invoking plugins that have registered hooks for a given event.
   *
   * @example
   * const routingPlugin = Plugin.create({ name: 'dynamic-routes' })
   *   .on('beforeInitialize', (app, context) => { })
   *   .on('beforeInitialize', (app, context) => { });
   */
  on<
    Event extends keyof PluginHooks<ExtendedAsterflow<Instance>, Context & Config, Extension>,
    Handler extends NonNullable<
      PluginHooks<ExtendedAsterflow<Instance>, Context & Config, Extension>[Event]
    > extends (infer F)[]
      ? F
      : never
  >(
    event: Event,
    handler: Handler
  ) {
    const existingHandlers = (this.hooks[event] as any[]) || []
    const newHooks = {
      ...this.hooks,
      [event]: [...existingHandlers, handler]
    }

    type NewHooks = Omit<Hooks, Event> & {
      [K in Event]: [
        ...(Hooks extends { [k in Event]: any[] } ? Hooks[K] : []),
        Handler
      ]
    };
    
    return new Plugin<Path, Instance, Config, Context, NewHooks, Extension>(
      this.name,
      this.resolvers,
      newHooks as unknown as NewHooks,
      this.defaultConfig,
      this._extensionFn
    )
  }

  /**
   * Defines new properties or methods to be added to the AsterFlow instance.
   * A função recebe a instância do app e o contexto do plugin, e deve retornar um objeto
   * com as novas propriedades.
   */
  extends<E extends Record<string, any>>(
    extensionFn: (app: Instance, context: Context) => E
  ) {
    return new Plugin<Path, Instance, Config, Context, Hooks, Extension & E>(
      this.name,
      this.resolvers,
      this.hooks,
      this.defaultConfig,
      (app, context) => {
        const prev = this._extensionFn ? this._extensionFn(app, context) : {} as Extension
        return { ...prev, ...extensionFn(app, context) } as Extension & E
      }
    )
  }

  /**
   * Builds the final context and hooks from the provided configuration.
   */
  _build(config: any) {
    const finalConfig = { ...this.defaultConfig, ...config } as Config & Context

    return {
      name: this.name,
      // O contexto inicial é a própria configuração.
      context: { ...finalConfig }, 
      hooks: this.hooks,
      _extensionFn: this._extensionFn,
      // Retorna os resolvers para execução posterior.
      resolvers: this.resolvers 
    }
  }

  /**
   * Creates a new Plugin instance. This is the entry point for building a plugin.
   */
  static create<Path extends string, Asterflow extends AnyAsterflow>(
    options: { name: Path }
  ): Plugin<Path, Asterflow, {}, {}, {}> {
    return new Plugin(options.name, [], {}, {}, undefined)
  }

  static instance<T extends AnyAsterflow>() {
    return {
      create: <Path extends string>(options: { name: Path }): Plugin<Path, T, {}, {}, {}, {}> => {
        return new Plugin<Path, T, {}, {}, {}, {}>(
          options.name, [], {}, {}, undefined
        )
      }
    }
  }
}