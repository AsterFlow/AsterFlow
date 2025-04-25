import { Response as ResponseCustom } from '@asterflow/router'
import type { ServeOptions as BunServeOptions } from 'bun'
import { type Express, type Request as ExpressRequest } from 'express'
import type { FastifyInstance, FastifyListenOptions, FastifyRequest } from 'fastify'
import { IncomingMessage } from 'http'
import type { ListenOptions } from 'net'

type AsterRequestTypes = FastifyRequest | Request | IncomingMessage | ExpressRequest

export enum Runtime {
  Bun = 'bun',
  Express = 'express',
  Node = 'node',
  Fastify = 'fastify',
}

export type ExpressListenArgs =
  | [app: Express, port: number, hostname: string, backlog: number, callback?: (err?: Error) => void]
  | [app: Express, port: number, hostname: string, callback?: (err?: Error) => void]
  | [app: Express, port: number, callback?: (err?: Error) => void]
  | [app: Express, path: string, callback?: (err?: Error) => void]

export type FastifyListenArgs = [fastify: FastifyInstance, params: FastifyListenOptions, callback: (err: Error | null, address: string) => void]
export type BunListenArgs = [options: Omit<BunServeOptions, 'fetch'>, callback?: (err: Error | null) => void]
export type NodeListenArgs = [options: ListenOptions, callback?: (err: Error | null) => void]

export type ListenParams<Type extends Runtime> =
  Type extends Runtime.Bun
    ? BunListenArgs
  : Type extends Runtime.Fastify
    ? FastifyListenArgs
  : Type extends Runtime.Express
    ? ExpressListenArgs
  : NodeListenArgs

export type OptionsDriver<Type extends Runtime> = {
  runtime: Type
  listen: (...params: ListenParams<Type>) => void
  onRequest?: (
    request: AsterRequestTypes,
    response: ResponseCustom
  ) => ResponseCustom | Promise<ResponseCustom>
}
