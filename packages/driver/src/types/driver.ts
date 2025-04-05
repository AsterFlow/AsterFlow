import type { ServeOptions as BunServeOptions } from 'bun'
import type { ServeOptions as DenoServeOptions } from 'deno'
import type { FastifyInstance, FastifyListenOptions } from 'fastify'
import { IncomingMessage, Server, ServerResponse } from 'http'
import type { ListenOptions } from 'net'

export enum Runtime {
  Bun = 'bun',
  Deno = 'deno',
  Node = 'node',
  Fastify = 'fastify',
}

type ListenParams<Type extends Runtime> =
  Type extends Runtime.Bun
  ? Omit<BunServeOptions, 'fetch'>
  : Type extends Runtime.Deno
  ? DenoServeOptions<Deno.NetAddr>
  : Type extends Runtime.Fastify
  ? FastifyListenOptions
  : ListenOptions

export type OptionsDriver<
  Type extends Runtime
>= {
  runtime: Type
  listen: Type extends Runtime.Fastify
    ? (fastify: FastifyInstance, params: ListenParams<Type>) => FastifyInstance
    : (params: ListenParams<Type>) => Server<typeof IncomingMessage, typeof ServerResponse> | Deno.HttpServer<Deno.NetAddr> | Bun.Server
}