export type Responders = { [x in number]: unknown }

export type BodyMap<Responder extends Responders> = {
  [S in keyof Responder]: Responder[S]
}

export type ResponseOptions<
  Responder extends Responders,
  BM extends BodyMap<Responder>,
  Status extends keyof BM ,
  Header extends Map<string, string>,
  Cookies extends Map<string, string>
> = {
  data?: BM[Status]
  code?: Status
  header?: Header
  cookies?: Cookies
}