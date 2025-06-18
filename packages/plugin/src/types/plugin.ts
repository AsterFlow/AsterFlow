 
import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow, ExtendedAsterflow } from '@asterflow/core'
import type { Request } from '@asterflow/request'
import type { AsterResponse, Prettify } from '@asterflow/response'
import type { Plugin } from '../controllers/Plugin'
import type { AnyRecord, UnionToIntersection } from './utils'

export type AnyPluginHooks = PluginHooks<AnyAsterflow, AnyRecord, AnyRecord>
export type AnyPlugin = Plugin<
  string,
  AnyAsterflow,
  AnyRecord,
  AnyRecord,
  AnyRecord,
  AnyRecord
>

export type AnyPlugins = Record<string, ResolvedPlugin<AnyPlugin>>
export type AnyPluginInstance = ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks }

export type InferPluginExtension<P> = P extends Plugin<any, any, any, any, any, infer Ext> ? Ext : {}
export type InferPluginContext<P> = P extends Plugin<any, any, infer Config, infer Decorate, infer Derive, any>
  ? Prettify<UnionToIntersection<Config | Decorate | Derive>>
  : {}

// Este é o tipo que será armazenado na instância do AsterFlow.
export type ResolvedPlugin<P extends Plugin<any, any, any, any, any, any>> = P extends Plugin<
  infer Path, any, any, infer Ctx, any, infer Ext
> ? {
  name: Path,
  context: Ctx,
  hooks: PluginHooks<any, Ctx, Ext>,
  _extensionFn?: (app: any, context: Ctx) => Ext,
  resolvers: Resolver[] 
} : never

/**
 * Tipo para extrair o objeto de configuração de um plugin.
 * Ele torna as propriedades com valores padrão opcionais.
 */
export type InferConfigArgument<P extends Plugin<any, any, any, any, any, any>>
  = P extends Plugin<any, any, infer C, any, any, any>
    ? Omit<C, keyof P['defaultConfig']> &
        Partial<Pick<C, keyof P['defaultConfig'] & keyof C>>
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
    { context, request, response }: { request: Request<Runtime>, response: AsterResponse, context: Context }
  ) => any | Promise<any>)[]
  onResponse?: ((
    { context, request, response }: { request: Request<Runtime>, response: AsterResponse, context: Context }
  ) => any | Promise<any>)[]
}

/**
 * Represents a function that resolves a part of the plugin's context.
 */
export type Resolver = (config: any, context: any) => Promise<Record<string, any>>