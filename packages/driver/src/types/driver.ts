import type { ServeOptions as BunServeOptions } from 'bun'
import type { ServeOptions as DenoServeOptions } from 'deno'
import type { FastifyInstance, FastifyListenOptions } from 'fastify'
import { IncomingMessage, Server, ServerResponse } from 'http'
import type { ListenOptions } from 'net'
import { Response as ResponseCustom, type AsterRequestTypes } from 'router'
import { type Express } from 'express'

export enum Runtime {
  Bun = 'bun',
  Express = 'express',
  Deno = 'deno',
  Node = 'node',
  Fastify = 'fastify',
}

type ExpressListenParameters =
  | [port: number, hostname: string, backlog: number, callback?: (error?: Error) => void]
  | [port: number, hostname: string, callback?: (error?: Error) => void]
  | [port: number, callback?: (error?: Error) => void]
  | [callback?: (error?: Error) => void]
  | [path: string, callback?: (error?: Error) => void]
  | [handle: any, listeningListener?: (error?: Error) => void];

type ListenParams<Type extends Runtime> =
  Type extends Runtime.Bun
  ? Omit<BunServeOptions, 'fetch'>
  : Type extends Runtime.Deno
  ? DenoServeOptions<Deno.NetAddr>
  : Type extends Runtime.Fastify
  ? FastifyListenOptions
  : Type extends Runtime.Express
  ? ExpressListenParameters
  : ListenOptions

export type OptionsDriver<
  Type extends Runtime
>= {
  runtime: Type
  listen: Type extends Runtime.Fastify
    ? (fastify: FastifyInstance, params: ListenParams<Type>) => FastifyInstance
    : Type extends Runtime.Express
    ?  (express: Express, params: ExpressListenParameters) => Express
    : (params: ListenParams<Type>) => Server<typeof IncomingMessage, typeof ServerResponse> | Deno.HttpServer<Deno.NetAddr> | Bun.Server
  onRequest?: ((request: AsterRequestTypes, response: ResponseCustom) => ResponseCustom) | undefined
}