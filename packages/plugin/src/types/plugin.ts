 
import type { Runtime } from '@asterflow/adapter'
import type { AnyAsterflow, ExtendedAsterflow } from '@asterflow/core'
import type { Request } from '@asterflow/request'
import type { Response } from '@asterflow/response'
import type { Plugin } from '../controllers/Plugin'

export type AnyPlugin = Plugin<string, any, any, any, any, any>;
export type AnyPlugins = Record<string, ResolvedPlugin<AnyPlugin>>
export type AnyPluginHooks = PluginHooks<any, any, any>
export type AnyPluginInstance = ResolvedPlugin<AnyPlugin> & { hooks: AnyPluginHooks }

export type InferPluginExtension<P> = P extends Plugin<any, any, any, any, any, infer Ext> ? Ext : {};

// Este é o tipo que será armazenado na instância do AsterFlow.
// Note que os hooks não carregam mais o tipo gigante e recursivo do App.
export type ResolvedPlugin<P extends AnyPlugin> = P extends Plugin<
  infer Path, any, any, infer Ctx, any, infer Ext
> ? {
  name: Path,
  context: Ctx,
  hooks: PluginHooks<any, Ctx, Ext>,
  _extensionFn?: (app: any, context: Ctx) => Ext,
  resolvers: Resolver[] 
} : never;

/**
 * Tipo para extrair o objeto de configuração de um plugin.
 * Ele torna as propriedades com valores padrão opcionais.
 */
export type ConfigArgument<P extends AnyPlugin>
  = P extends Plugin<any, any, infer C, any, any>
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
  beforeInitialize?: ((app: ExtendedAsterflow<Instance> & Extension, context: Context) => void | Promise<void>)[]
  afterInitialize?: ((app: ExtendedAsterflow<Instance> & Extension, context: Context) => void | Promise<void>)[]
  onRequest?: ((request: Request<Runtime>, response: Response, context: Context) => void | Promise<void>)[]
  onResponse?: ((request: Request<Runtime>, response: Response, context: Context) => void | Promise<void>)[]
}

/**
 * Represents a function that resolves a part of the plugin's context.
 * @internal
 */
export type Resolver = (config: any, context: any) => Promise<Record<string, any>>