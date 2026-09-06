 
import type { Runtime } from '@asterflow/adapter'
import type { Request } from '@asterflow/request'
import type { AsterResponse, Prettify } from '@asterflow/response'
import type { AnyRouter } from '@asterflow/router'
import type { AnyAsterflow, ExtendedAsterflow, RouteEntry } from 'asterflow'
import type { Plugin } from '../controllers/Plugin'
import type { AnyRecord, UnionToIntersection } from './utils'

/** `Plugin`'s single generic parameter - the fields it needs to type a plugin. */
export interface PluginProps {
  path: string
  instance: AnyAsterflow
  config: Record<string, any>
  decorate: Record<string, any>
  derive: Record<string, any>
  extension: Record<string, any>
}

export type DefaultPluginProps = {
  path: string
  instance: AnyAsterflow
  config: {}
  decorate: {}
  derive: {}
  extension: {}
}

export type AnyPluginHooks = PluginHooks<AnyAsterflow, AnyRecord, AnyRecord>
export type AnyPlugin = Plugin<any>

export type AnyPlugins = Record<string, ResolvedPlugin<AnyPlugin>>
export type AnyPluginInstance = ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks }

export type InferPluginExtension<P> = P extends Plugin<infer Props extends PluginProps> ? Props['extension'] : {}
export type InferPluginContext<P> = P extends Plugin<infer Props extends PluginProps>
  ? Prettify<UnionToIntersection<Props['config'] | Props['decorate'] | Props['derive']>>
  : {}

// Este é o tipo que será armazenado na instância do AsterFlow.
export type ResolvedPlugin<P extends Plugin<any>> = P extends Plugin<infer Props extends PluginProps>
  ? {
    name: Props['path'],
    // Merges Config, Decorate AND Derive - matches the runtime `_build()`
    // merge (`{ ...defaultConfig, ...config } as Config & Derive & Decorate`).
    // Previously (pre-`PluginProps`) this only captured `Decorate`, a
    // pre-existing bug fixed here.
    context: InferPluginContext<P>,
    hooks: PluginHooks<any, InferPluginContext<P>, Props['extension']>,
    _extensionFn?: (app: any, context: InferPluginContext<P>) => Props['extension'],
    resolvers: Resolver[]
  } : never

/**
 * Tipo para extrair o objeto de configuração de um plugin.
 * Ele torna as propriedades com valores padrão opcionais.
 */
export type InferConfigArgument<P extends Plugin<any>>
  = P extends Plugin<infer Props extends PluginProps>
    ? Omit<Props['config'], keyof P['defaultConfig']> &
        Partial<Pick<Props['config'], keyof P['defaultConfig'] & keyof Props['config']>>
    : never

/**
 * Defines the available lifecycle hooks a plugin can register.
 */
export type PluginHooks<
  Instance extends AnyAsterflow,
  Context extends Record<string, any>,
  Extension extends Record<string, any> = {}
> = {
  beforeInitialize?: ((app: ExtendedAsterflow<Instance> & Extension, context: Context) => any | Promise<any>)[]
  afterInitialize?: ((app: ExtendedAsterflow<Instance> & Extension, context: Context) => any | Promise<any>)[]
  onRequest?: ((
    {
      instance,
      router,
      plugin,
      request,
      response
    }: {
      instance: ExtendedAsterflow<Instance>
      router: RouteEntry<string, AnyRouter>,
      request: Request<Runtime>,
      response: AsterResponse,
      plugin: AnyPluginInstance
    }
  ) => any | Promise<any>)[]
  onResponse?: ((
    {
      instance,
      router,
      plugin,
      request,
      response
    }: {
      instance: ExtendedAsterflow<Instance>
      router: RouteEntry<string, AnyRouter>,
      request: Request<Runtime>,
      response: AsterResponse,
      plugin: AnyPluginInstance
    }
  ) => any | Promise<any>)[]
}

/**
 * Represents a function that resolves a part of the plugin's context.
 */
export type Resolver = (config: any, context: any) => Promise<Record<string, any>>