 
import type { AnyAsterflow, ExtendedAsterflow } from 'asterflow'
import type { PluginHooks, Resolver } from '../types/plugin'
import type { Prettify, UnionToIntersection } from '../types/utils'

export class Plugin<
  Path extends string = string,
  Instance extends AnyAsterflow = AnyAsterflow,
  Config extends Record<string, any> = {},
  Decorate extends Record<string, any> = {},
  Derive extends Record<string, any> = {},
  Extension extends Record<string, any> = {}
> {
  public readonly name: Path
  public resolvers: Resolver[]
  public defaultConfig: Partial<Config>
  public hooks: PluginHooks<any, Decorate, any> = {}
  public instance!: Instance
  private _extensionFn?: (app: Instance, context: Prettify<UnionToIntersection<Config & Decorate & Derive>>) => Extension

  private constructor(
    name: Path,
    resolvers: Resolver[],
    hooks: PluginHooks<any, Decorate, any>,
    defaultConfig: Partial<Config>,
    extensionFn?: (app: Instance, context: Prettify<UnionToIntersection<Config & Decorate & Derive>>) => Extension
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
    this.defaultConfig = {
      ...this.defaultConfig,
      defaultConfig
    } as Partial<Config>

    return this as unknown as Plugin<Path, Instance, Prettify<UnionToIntersection<{ defaultConfig: C } | C | Config>>, Decorate, Derive, Extension>
  }
  
  /**
   * O `defineInstance` agora é mais simples. Ele não precisa mais re-tipar
   * a classe inteira. Ele só serve para passar o `this` para o `_build`.
   */
  defineInstance<Instanced extends AnyAsterflow>(instance: Instanced) {
    this.instance = instance as unknown as Instance
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

    this.resolvers = [...this.resolvers, resolver]
    return this as unknown as Plugin<Path, Instance, Config, Prettify<UnionToIntersection<Decorate | { [K in Key]: Value }>>, Derive, Extension>
  }

  /**
   * Adds a new property to the context that is derived from the configuration and the existing context.
   * The resolver function is executed lazily when the plugin is registered via `app.use()`.
   */
  derive<Key extends string, Value>(
    key: Key,
    resolverFn: (context: Derive & Config & Decorate) => Value | Promise<Value>
  ) {
    const resolver: Resolver = async (config, context) => {
      const fullContext = { ...context, ...config }
      const derivedValue = await resolverFn(fullContext)
      return {
        ...context,
        [key]: derivedValue
      }
    }

    this.resolvers = [...this.resolvers, resolver]
    return this as unknown as Plugin<Path, Instance, Config, Decorate, Prettify<UnionToIntersection<Derive | { [K in Key]: Awaited<Value> }>>, Extension>
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
    Event extends keyof PluginHooks<ExtendedAsterflow<Instance>, Prettify<UnionToIntersection<Derive | Config | Decorate>>, Extension>,
  >(
    event: Event,
    handler: NonNullable<PluginHooks<ExtendedAsterflow<Instance>, Prettify<UnionToIntersection<Derive | Config | Decorate>>, Extension>[Event]>[number]
  ) {
    const existingHandlers = (this.hooks[event] as any[]) || []
    this.hooks = {
      ...this.hooks,
      [event]: [...existingHandlers, handler]
    }

    
    return this
  }

  /**
   * Defines new properties or methods to be added to the AsterFlow instance.
   * A função recebe a instância do app e o contexto do plugin, e deve retornar um objeto
   * com as novas propriedades.
   */
  extends<E extends Record<string, any>>(
    extensionFn: (app: Instance, context: Prettify<UnionToIntersection<Config | Derive | Decorate>>) => E
  ) {
    const previousExtensionFn = this._extensionFn

    this._extensionFn = (app, context) => {
      const prev = previousExtensionFn ? previousExtensionFn(app, context) : {} as Extension
      
      return { ...prev, ...extensionFn(app, context) }
    }

    return this as Plugin<Path, Instance, Config, Decorate, Derive, Prettify<UnionToIntersection<Extension & E>>>
  }

  /**
   * Builds the final context and hooks from the provided configuration.
   */
  _build(config: any) {
    const finalConfig = { ...this.defaultConfig, ...config } as Config & Derive & Decorate

    return {
      name: this.name,
      context: { ...finalConfig }, 
      hooks: this.hooks,
      _extensionFn: this._extensionFn,
      resolvers: this.resolvers 
    }
  }

  /**
   * Creates a new Plugin instance. This is the entry point for building a plugin.
   */
  static create<Path extends string, Asterflow extends AnyAsterflow>(
    options: { name: Path }
  ): Plugin<Path, Asterflow, {}, {}, {}, {}> {
    return new Plugin(options.name, [], {}, {}, undefined)
  }
}