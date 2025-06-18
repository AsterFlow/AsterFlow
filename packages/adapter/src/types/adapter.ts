import type { Request } from '@asterflow/request'
import type { AsterResponse} from '@asterflow/response'
import type { ServeOptions as BunServeOptions } from 'bun'
import type { Express } from 'express'
import type { FastifyInstance, FastifyListenOptions } from 'fastify'
import type { ListenOptions } from 'net'
import type { Adapter } from '../controllers/Adapter'

export enum Runtime {
  Bun = 'bun',
  Express = 'express',
  Node = 'node',
  Fastify = 'fastify',
}

export type ExpressListenArgs =
  | [port: number, hostname: string, backlog: number, callback?: (err?: Error) => void]
  | [port: number, hostname: string, callback?: (err?: Error) => void]
  | [port: number, callback?: (err?: Error) => void]
  | [path: string, callback?: (err?: Error) => void]

export type FastifyListenArgs = [fastify: FastifyInstance, params: FastifyListenOptions, callback: (err: Error | null, address: string) => void]
export type BunListenArgs = [options: Omit<BunServeOptions, 'fetch'>, callback?: (err: Error | null) => void]
export type NodeListenArgs = [options: ListenOptions, callback?: (err: Error | null) => void]

export interface ListenParams {
  [Runtime.Bun]: BunListenArgs
  [Runtime.Fastify]: FastifyListenArgs
  [Runtime.Express]: [app: Express, ExpressListenArgs]
  [Runtime.Node]: NodeListenArgs
}

export type AnyAdapter = 
  | Adapter<Runtime.Bun>
  | Adapter<Runtime.Express>
  | Adapter<Runtime.Node>
  | Adapter<Runtime.Fastify>

export type OptionsDriver<Type extends Runtime> = {
  runtime: Type
  listen: (...params: ListenParams[Type]) => void
  onRequest?: (
    request: Request<Type>,
    response?: AsterResponse
  ) => AsterResponse | Promise<AsterResponse>
}
