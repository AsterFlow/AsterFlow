import type { Request } from '@asterflow/request'
import { Response as ResponseCustom } from '@asterflow/router'
import type { ServeOptions as BunServeOptions } from 'bun'
import { type Express } from 'express'
import type { FastifyInstance, FastifyListenOptions } from 'fastify'
import type { ListenOptions } from 'net'

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

export type ListenParams<Type extends Runtime> =
  Type extends Runtime.Bun
    ? BunListenArgs
  : Type extends Runtime.Fastify
    ? FastifyListenArgs
  : Type extends Runtime.Express
    ? [app: Express, ExpressListenArgs]
  : NodeListenArgs

export type OptionsDriver<Type extends Runtime> = {
  runtime: Type
  listen: (...params: ListenParams<Type>) => void
  onRequest?: <RequestType> (
    request: Request<RequestType>,
    response?: ResponseCustom
  ) => ResponseCustom | Promise<ResponseCustom>
}
