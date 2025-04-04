import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z, ZodError, ZodTypeAny } from 'zod'
/*
 * Enum for HTTP method types.
 */
export enum MethodType {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  socket = 'socket'
}

export const CodesSuccess = [200, 201] as const
export const CodesError = [401, 400, 403, 404, 409, 422, 500] as const
export type MethodKeys = keyof typeof MethodType
export type Codes = (typeof CodesSuccess[number]) | (typeof CodesError[number])

export type ErrorData = { message: string; error?: ZodError }
export type ListResponse = {
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
}
export type SucessData<TData> = {
  message: string
  data: TData
} & (TData extends unknown[] ? { metadata: ListResponse } : object)

export type TReplySuccess<TData> = {
  [Status in typeof CodesSuccess[number]]: SucessData<TData>
}

export type TReplyError = {
  [Status in typeof CodesError[number]]: ErrorData
}

export type Responders = { [x in number]: unknown }
export type TReply<TData> = TReplySuccess<TData> & TReplyError
export type SchemaDynamic<M extends MethodKeys> = { [K in M]?: ZodTypeAny }

export type ZodInferredData<
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
> = Schema[Method] extends z.ZodTypeAny
  ? z.infer<Schema[Method]>
  : unknown
export type ReplyKeys = keyof TReply<unknown>
export type ResolveReply<
  Code extends ReplyKeys,
  Responder extends Responders
> =
  Code extends keyof Responder ? Responder[Code] : never

export type TypedReply<
  TData,
  Code extends ReplyKeys,
  Responder extends Responders,
> = 
  Omit<FastifyReply, 'code'|'status'|'send'> & {
    code<C extends ReplyKeys>(statusCode: C): TypedReply<TData, C, Responder>
    status<C extends ReplyKeys>(statusCode: C): TypedReply<TData, C, Responder>
    send<D extends ResolveReply<Code, Responder>>(payload?: D): TypedReply<D, Code, Responder> // { [C in Code]: ResolveReply<D, Code, Responder> }

  }

export type RouteHandler<
  Responder extends Responders,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  > = <
  TData,
  StatusCodes extends ReplyKeys,
> (args: {
  request: FastifyRequest
  reply: TypedReply<TData, StatusCodes, Responder>;
  schema: ZodInferredData<Method, Schema>;
}) => TypedReply<TData, StatusCodes, Responder>

export type RouterOptions<
  Path extends string,
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
  Responder extends Responders,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Responder, Method, Schema> },
> = {
  name?: string
  description?: string
  path: Path
  schema?: Schema
  methods: Routers
}