export enum Delimiters {
  /**
   * @property &
   */
  Ampersand = 38,
  /**
   * @property ;
   */
  Semicolon = 59,
  /**
   * @property #
   */
  Hash = 35,
  /**
   * @property ?
   */
  Query = 63,
  /**
   * @property :
   */
  Colon = 58,
  /**
   * @property /
   */
  Slash = 47
}

export enum EncodingSymbols {
  /**
   * @property =
   */
  Equal = 61,
}
 
export enum OriginExpression {
  Protocol = 246,
  Hostname = 245,
  Port = 244
}

export enum InternalExpression {
  Null = 0,   // no active token
  Path = 251, // marks start/end of a key
  Variable = 252, // marks start/end of a key
  Fragment = 253, // marks start/end of a key
  Parameter = 254, // marks start/end of a key
  Value = 255, // marks start/end of a value
}

export enum ContentTypes {
  Boolean = 247,
  String = 248,
  Number = 249,
  Array = 250,
}

export type AllValues = 
  | Delimiters
  | EncodingSymbols
  | InternalExpression
  | OriginExpression

export const delimitersValues = Object.values(Delimiters)
export const RawTokens = {
  ...Delimiters,
  ...EncodingSymbols,
  ...OriginExpression,
  ...InternalExpression,
  ...ContentTypes,
} as const