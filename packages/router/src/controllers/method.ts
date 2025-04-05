import { type ZodTypeAny } from "zod"
import type { MethodHandler, MethodOptions } from "../types/method"
import type { MethodKeys } from "../types/router"

export class Method<
  Path extends string,
  Method extends MethodKeys,
  Schema extends ZodTypeAny,
  Handler extends MethodHandler<Schema>
>{
  path: Path
  method: Method
  schema?: Schema
  
  name?: string
  use: [] = []
  handler: Handler

  constructor (options: MethodOptions<Path, Method, Schema, Handler>) {
    this.path = options.path
    this.method = options.method
    this.schema = options.schema
    this.handler = options.handle
  }
}