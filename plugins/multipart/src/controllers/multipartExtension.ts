import { Method, RouteMethodBuilder } from '@asterflow/router'
import type { MultipartFields } from '../types/multipart'

let installed = false

/**
 * Runtime half of `.multipart(schema)`, declared in `types/asterflow.d.ts`
 * (declaration merging is types-only). Called from `index.ts`; its return
 * value is threaded into `.decorate(...)` rather than called as a bare
 * statement because Bun's transpiler dead-code-eliminates a side-effecting
 * call whose result isn't otherwise used.
 */
export function installExtension(): true {
  if (installed) return true
  installed = true

  Method.prototype.multipart = function (
    this: Method<any, any, any, any, any, any, any, any, any, any>,
    schema: MultipartFields
  ) {
    return this.extend({}, { multipart: schema })
  }

  RouteMethodBuilder.prototype.multipart = function (
    this: RouteMethodBuilder<any, any, any, any, any, any>,
    schema: MultipartFields
  ) {
    return this.extend({}, { multipart: schema })
  }

  return true
}
