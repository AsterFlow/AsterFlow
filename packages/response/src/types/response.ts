export interface Responders { [code: number]: unknown }
export type BodyMap<Responder extends Responders> = {
  [S in keyof Responder]: Responder[S]
}

export type BaseContext = {
  header: Record<string, string>
  cookies: Record<string, string>
}

export type ResponseOptions<
  RawResponder extends Responders,
  BodySchema extends BodyMap<RawResponder>,
  StatusCode extends keyof BodySchema,
  Context extends BaseContext
> = {
  data?: BodySchema[StatusCode]
  code?: StatusCode
  context?: Context
}