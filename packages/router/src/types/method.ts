import type { z, ZodTypeAny } from "zod";
import type { MethodKeys, Responders } from "./router";
import type { Response } from "../controllers/response";
import type { FastifyRequest } from "fastify";
import type { AsterRequest } from "../controllers/Request";

export type MethodHandler<
  Responder extends Responders,
  Schema extends ZodTypeAny
> =(args: {
  response: Response<Responder>;
  request: AsterRequest
  schema: z.infer<Schema>
}) => Promise<Response<Responder>> | Response<Responder>

export type MethodOptions<
  Responder extends Responders,
  Path extends string,
  Method extends MethodKeys,
  Schema extends ZodTypeAny,
  Handler extends MethodHandler<Responder, Schema>,
> = {
  path: Path,
  name?: string,
  method: Method,
  schema?: Schema
  handle: Handler
}