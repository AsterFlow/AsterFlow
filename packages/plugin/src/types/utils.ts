export type AnyRecord = Record<string, any>
// Transforma uma união (A | B) em uma interseção (A & B).
export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// Isso faz com que { a: string } & { b: number } seja exibido como { a: string; b: number; }
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};