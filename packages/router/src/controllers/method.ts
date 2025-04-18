import type { BaseShapeAbstract, InferType } from "@caeljs/config"
import type { MethodHandler, MethodOptions } from "../types/method"
import type { MethodKeys, Responders } from "../types/router"
import type { ZodTypeAny } from "zod"

export class Method<
  Responder extends Responders,
  const Path extends string = string,
  const Method extends MethodKeys = MethodKeys,
  const Schema extends BaseShapeAbstract<any> | ZodTypeAny = ZodTypeAny,
  const Handler extends MethodHandler<Responder, Schema> = MethodHandler<Responder, Schema>
>{
  path: Path
  method: Method
  schema?: Schema
  
  name?: string
  use: [] = []
  handler: Handler

  constructor (options: MethodOptions<Responder, Path, Method, Schema, Handler>) {
    this.path = options.path
    this.method = options.method
    this.schema = options.schema
    this.handler = options.handler
  }
}