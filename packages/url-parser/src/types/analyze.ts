/* eslint-disable @typescript-eslint/no-unused-vars */
// Mapeia uma string ‘number’, ‘boolean’, ‘string’ ou listas ‘1,2,3’ para o tipo correspondente
type TypeMap<T extends string> =
  T extends 'string'   ? string :
  T extends 'number'   ? number :
  T extends 'boolean'  ? boolean :
  // Se for uma lista “a,b,c” ou “1,2,3”, pega o primeiro elemento e faz array
  T extends `${infer First},${infer _Rest}` ? TypeMap<First>[] :
  string

// Divide S por um delimitador D em tupla de strings
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : S extends '' 
      ? []
      : [S]

// Remove a parte de query (‘?…’) e fragment (‘#…’), e a barra inicial
type ExtractPath<S extends string> =
  S extends `${infer P}?${string}` ? P :
  S extends `${infer P}#${string}` ? P :
  S extends `/${infer Rest}`     ? Rest
  : S

// Extrai só a parte de query, sem a fragment
type ExtractQuery<S extends string> =
  S extends `${string}?${infer Q}` 
    ? Q extends `${infer QnoFrag}#${string}` 
      ? QnoFrag 
      : Q
    : ''

// Extrai só a parte de fragment
type ExtractFrag<S extends string> =
  S extends `${string}#${infer F}` ? F : ''

// Constrói o objeto params a partir dos segmentos “:chave=tipo”
type ParseParams<S extends string> = {
  [Seg in Split<ExtractPath<S>, '/'>[number] as
    Seg extends `:${infer Key}=${infer _T}` ? Key : never
  ]: Seg extends `:${infer _Key}=${infer T}`
    ? TypeMap<T>
    : never
}

// Constrói o objeto searchParams, aceitando “chave=valor” ou só “chave”
type ParseSearch<S extends string> = {
  [Param in Split<ExtractQuery<S>, '&'>[number] as
    Param extends `${infer Key}=${infer _V}` ? Key : Param
  ]:
    Param extends `${infer _Key}=${infer V}`
      ? TypeMap<V>
      : string
}

// Constrói o objeto fragment, que sempre será string
type ParseFragment<S extends string> =
  ExtractFrag<S> extends ''
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    ? {}
    : { [K in ExtractFrag<S>]: string }

// Tipo final que junta tudo
export type ParsePath<S extends string> = {
  params:       ParseParams<S>
  searchParams: ParseSearch<S>
  fragment:     ParseFragment<S>
}