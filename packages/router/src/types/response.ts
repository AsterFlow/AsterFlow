export type ResponseOptions<
  Data extends unknown,
  Status extends number,
  Header extends Map<string, string>,
  Cookies extends Map<string, string>
> = {
  data?: Data
  code?: Status
  header?: Header
  cookies?: Cookies
}