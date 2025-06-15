import type { OutgoingHttpHeaders } from 'http'


type OmitIndexSignature<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
}

/**
 * HTTP header strings
 * Use this type only for input values, not for output values.
 */
export type HttpHeader = keyof OmitIndexSignature<OutgoingHttpHeaders> | (string & Record<never, never>)

/**
 * Forces TypeScript to evaluate and “flatten” the structure of an object type.
 */
export type Prettify<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
} & {};