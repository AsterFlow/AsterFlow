import type { AsterFlow } from '@asterflow/core'
import type { Request } from '@asterflow/request'
import type { Response } from '@asterflow/response'
import type { Plugin } from '../controllers/Plugin'

export type AnyPlugin = Plugin<string>
export type AnyPluginHooks = PluginHooks<any, any, any, any>

/**
 * Tipo para extrair o objeto de configuração de um plugin.
 * Ele torna as propriedades com valores padrão opcionais.
 */
export type ConfigArgument<P extends AnyPlugin>
  = P extends Plugin<any, any, any, infer C>
    ? Omit<C, keyof P['defaultConfig']> &
        Partial<Pick<C, keyof P['defaultConfig'] & keyof C>>
    : never

/**
 * Tipo para o plugin após seu contexto ter sido construído.
 */
export type ResolvedPlugin<P extends AnyPlugin> = ReturnType<P['_build']>

/**
 * Defines the available lifecycle hooks a plugin can register.
 */
export type PluginHooks<
  Instance extends AsterFlow<any>,
  Context extends Record<string, any>,
  Responser extends Response,
  Requester extends Request<unknown>
> = {
  beforeInitialize?: ((app: Instance, context: Context) => void | Promise<void>)[]
  afterInitialize?: ((app: Instance, context: Context) => void | Promise<void>)[]
  onRequest?: ((request: Requester, response: Responser, context: Context) => void | Promise<void>)[]
  onResponse?: ((request: Requester, response: Responser, context: Context) => void | Promise<void>)[]
}

/**
 * Represents a function that resolves a part of the plugin's context.
 * @internal
 */
export type Resolver = (config: any, context: any) => Record<string, any>