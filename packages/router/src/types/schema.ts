import type { TshViewer, AbstractShape } from '@caeljs/tsh'
import type { TypeOf, ZodTypeAny } from 'zod'
import type { MethodKeys } from './method'

export type AnySchema = AbstractShape<any> | ZodTypeAny
export type SchemaDynamic<Method extends MethodKeys> = { [K in Method]?: AnySchema }

export type InferSchema<S> = S extends AbstractShape<any> 
  ? TshViewer<ReturnType<S['parse']>>
  : S extends ZodTypeAny
  ? TypeOf<S>
  : never

export type InferredData<
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
> = InferSchema<Schema[Method]>