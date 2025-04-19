import { BaseShapeAbstract, type InferType } from '@caeljs/config'
import { type Request as ExpressRequest } from 'express'
import type { FastifyRequest } from 'fastify'
import { IncomingMessage } from 'http'
import { type ZodTypeAny } from 'zod'
import type { AsterRequest } from '../controllers/Request'
import type { Response } from '../controllers/Response'
import type { MethodKeys, Responders } from './router'

export type AsterRequestTypes = FastifyRequest | Request | IncomingMessage | ExpressRequest;

export type MethodHandler<
  Responder extends Responders,
  Schema
> =(args: {
  response: Response<Responder>;
  request: AsterRequest<AsterRequestTypes>
  schema: Schema;
}) => Promise<Response<Responder>> | Response<Responder>

export type MethodOptions<
  Responder extends Responders,
  Path extends string,
  Method extends MethodKeys,
  Schema extends BaseShapeAbstract<any> | ZodTypeAny,
  Handler extends MethodHandler<Responder, Schema extends BaseShapeAbstract<any> ? InferType<Schema> : ReturnType<Schema['parse']>>,
> = {
  path: Path,
  name?: string,
  method: Method,
  schema?: Schema
  handler: Handler
}