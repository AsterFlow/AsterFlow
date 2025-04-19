import { Runtime, type OptionsDriver } from '../types/driver'
import { Response as ResponseCustom, type AsterRequestTypes } from 'router'

export class Driver<
  Type extends Runtime
> {
  readonly runtime: Type
  readonly listen: OptionsDriver<Type>['listen']
  onRequest: ((request: AsterRequestTypes, response: ResponseCustom) => Promise<Response> | Response) | undefined = undefined
  
  constructor ({ runtime , listen }: OptionsDriver<Type>) {
    this.runtime = runtime
    this.listen = listen
  }
}
