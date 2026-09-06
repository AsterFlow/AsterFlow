
import type { AnyAsterflow, ExtendedAsterflow } from 'asterflow'
import type { DefaultPluginProps, PluginHooks, PluginProps, Resolver } from '../types/plugin'
import type { MergeProps, Prettify, UnionToIntersection } from '../types/utils'

export class Plugin<
  const Props extends PluginProps = DefaultPluginProps
> {
  public readonly name: Props['path']
  public resolvers: Resolver[]
  public defaultConfig: Partial<Props['config']>
  public hooks: PluginHooks<any, Props['decorate'], any> = {}
  public instance!: Props['instance']
  private _extensionFn?: (app: Props['instance'], context: Prettify<UnionToIntersection<Props['config'] & Props['decorate'] & Props['derive']>>) => Props['extension']

  private constructor(
    name: Props['path'],
    resolvers: Resolver[],
    hooks: PluginHooks<any, Props['decorate'], any>,
    defaultConfig: Partial<Props['config']>,
    extensionFn?: (app: Props['instance'], context: Prettify<UnionToIntersection<Props['config'] & Props['decorate'] & Props['derive']>>) => Props['extension']
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
    } as Partial<Props['config']>

    return this as unknown as Plugin<MergeProps<Props, { config: Prettify<UnionToIntersection<{ defaultConfig: C } | C | Props['config']>> }>>
  }

  /**
   * O `defineInstance` agora é mais simples. Ele não precisa mais re-tipar
   * a classe inteira. Ele só serve para passar o `this` para o `_build`.
   */
  defineInstance<Instanced extends AnyAsterflow>(instance: Instanced) {
    this.instance = instance as unknown as Props['instance']
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
    return this as unknown as Plugin<MergeProps<Props, { decorate: Prettify<UnionToIntersection<Props['decorate'] | { [K in Key]: Value }>> }>>
  }

  /**
   * Adds a new property to the context that is derived from the configuration and the existing context.
   * The resolver function is executed lazily when the plugin is registered via `app.use()`.
   */
  derive<Key extends string, Value>(
    key: Key,
    resolverFn: (context: Props['derive'] & Props['config'] & Props['decorate']) => Value | Promise<Value>
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
    return this as unknown as Plugin<MergeProps<Props, { derive: Prettify<UnionToIntersection<Props['derive'] | { [K in Key]: Awaited<Value> }>> }>>
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
    Event extends keyof PluginHooks<ExtendedAsterflow<Props['instance']>, Prettify<UnionToIntersection<Props['derive'] | Props['config'] | Props['decorate']>>, Props['extension']>,
  >(
    event: Event,
    handler: NonNullable<PluginHooks<ExtendedAsterflow<Props['instance']>, Prettify<UnionToIntersection<Props['derive'] | Props['config'] | Props['decorate']>>, Props['extension']>[Event]>[number]
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
    extensionFn: (app: Props['instance'], context: Prettify<UnionToIntersection<Props['config'] | Props['derive'] | Props['decorate']>>) => E
  ) {
    const previousExtensionFn = this._extensionFn

    this._extensionFn = (app, context) => {
      const prev = previousExtensionFn ? previousExtensionFn(app, context) : {} as Props['extension']

      return { ...prev, ...extensionFn(app, context) }
    }

    return this as unknown as Plugin<MergeProps<Props, { extension: Prettify<UnionToIntersection<Props['extension'] & E>> }>>
  }

  /**
   * Builds the final context and hooks from the provided configuration.
   */
  _build(config: any) {
    const finalConfig = { ...this.defaultConfig, ...config } as Props['config'] & Props['derive'] & Props['decorate']

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
  ): Plugin<{ path: Path, instance: Asterflow, config: {}, decorate: {}, derive: {}, extension: {} }> {
    return new Plugin(options.name, [], {}, {}, undefined)
  }
}