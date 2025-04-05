import type { z, ZodTypeAny } from "zod";
import type { MethodKeys } from "./router";
import type { Response } from "../controllers/response";

export type MethodHandler<Schema extends ZodTypeAny>= (args: {
  response: Response;
  // request: FastifyRequest
  schema: z.infer<Schema>
}) => Response

export type MethodOptions<
  Path extends string,
  Method extends MethodKeys,
  Schema extends ZodTypeAny,
  Handler extends MethodHandler<Schema>
  > = {
  path: Path,
  name?: string,
  method: Method,
  schema?: Schema
  handle: Handler
}