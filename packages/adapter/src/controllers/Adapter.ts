import type { Request } from '@asterflow/request'
import { Response as ResponseCustom } from '@asterflow/response'
import { Runtime, type OptionsDriver } from '../types/adapter'

export class Adapter<Type extends Runtime> {
  readonly runtime: Type
  readonly listen: OptionsDriver<Type>['listen']
  onRequest: ((request: Request<Type>, response: ResponseCustom) => Promise<Response> | Response) | undefined = undefined
  
  constructor ({ runtime , listen }: OptionsDriver<Type>) {
    this.runtime = runtime
    this.listen = listen
  }
}
