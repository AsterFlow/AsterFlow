import type { Request } from '@asterflow/request'
import { Runtime, type OptionsDriver } from '../types/adapter'
import { Response as ResponseCustom  } from '@asterflow/router'

export class Adapter<
  Type extends Runtime
> {
  readonly runtime: Type
  readonly listen: OptionsDriver<Type>['listen']
  onRequest: (<RequestType> (request: Request<RequestType>, response: ResponseCustom) => Promise<Response> | Response) | undefined = undefined
  
  constructor ({ runtime , listen }: OptionsDriver<Type>) {
    this.runtime = runtime
    this.listen = listen
  }
}
