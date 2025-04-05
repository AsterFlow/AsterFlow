import { Runtime, type OptionsDriver } from "../types/driver";
import { Response as ResponseCustom } from 'router'

export class Driver<
  Type extends Runtime
> {
  static onRequest: (request: Request, response: ResponseCustom) => Response
  readonly runtime: Type
  readonly listen: OptionsDriver<Type>['listen']

  constructor ({ runtime , listen}: OptionsDriver<Type>) {
    this.runtime = runtime
    this.listen = listen
  }
}
