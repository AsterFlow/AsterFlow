import type { ParsePath } from '../types/analyze'
import { ContentTypes, Delimiters, delimitersValues, EncodingSymbols, InternalExpression, OriginExpression, RawTokens, type AllValues } from '../types/node'
import { AnsiColor, colorize, expressionKeyColorMap } from '../utils/colors'
import decodeURIComponentUTF8 from '../utils/decodeURL'
import { colorizePath, renderTable } from '../utils/table'
import { Node } from './Node'

/**
 * Parses and analyzes a URL template or real URL, extracting parameters, variables,
 * path segments, search params, fragment, and origin components (protocol, hostname, port).
 * Provides helper methods to retrieve and cast values according to defined types.
 *
 * @example
 * ```ts
 * import { Analyze } from '@asterflow/url-parser'
 *
 * // Template with typed parameter declaration and defaults
 * const template = 'http://example.com/users/:id=number?active=boolean'
 * const parser = new Analyze(template)
 * 
 * // Display internal node table
 * console.log(parser.display())
 * console.log(parser.getPathname()) // '/users/:id'
 * console.log(parser.getParams()) // ['id']
 * console.log(parser.getSearchParams()) // Map(1) { "active": "boolean" }
 * 
 * // Parse an actual URL
 * const url = 'http://example.com/users/42?active=true'
 * const parsed = new Analyze(url, parser)
 * 
 * console.log(parsed.getPathname()) // '/users/42'
 * console.log(parsed.getParams()) // { id: 42 }
 * console.log(parsed.getSearchParams()) // { active: true }
 * ```
 */
export class Analyze<
  const Path extends string,
  const TypedPath extends ParsePath<Path> = ParsePath<Path>,
  const Parser extends Analyze<string> | undefined = undefined
>{
  private readonly expressions: Set<number>
  readonly input: Path
  readonly nodes: Node[]

  base?: Parser
  isParser: Parser extends undefined ? true : false

  constructor(input: Path, base?: Parser) {
    this.input = input
    
    if (base) {
      this.base = base
      this.isParser = false as Parser extends undefined ? true : false
    } else {
      this.isParser = true as Parser extends undefined ? true : false
    }
  
    const { expressions, nodes } = Analyze.parser(this.input)
    this.nodes = nodes
    this.expressions = expressions
  }

  /**
   * Returns an array of parameter names declared in the template (without values).
   * @returns {string[]} List of parameter names.
   * @throws {Error} If duplicate parameter names are detected.
   * @example
   * ```ts
   * const analyzer = new Analyze('http://localhost:3000/:a/:b')
   * console.log(analyzer.getParams()) // ['a','b']
   * ```
   */
  getParams(this: Analyze<Path, TypedPath>): string[]
  getParams(this: Analyze<Path, TypedPath, Analyze<any>>): TypedPath['params']
  getParams(): string[] | TypedPath['params'] {
    /**
     * Caso seja expecificado um parser na variavel this.parser
     */
    if (this.base && this.base.isParser) {
      const params: Record<string, string | number | boolean | string[]> = {}

      if (this.base.expressions.has(InternalExpression.Variable)) {
        const slashs = this.base.nodes.filter((node) => node.expression === Delimiters.Slash)
    
        for (let idx = 0; idx < slashs.length; idx ++) {
          const variable = this.base.getNode(slashs[idx]!.id + 2)
          if (variable?.expression !== InternalExpression.Variable) continue
    
          const type = this.base.getType(variable.id + 2) ?? ContentTypes.String
    
          const nodeSlash = this.getNodeByType(Delimiters.Slash, idx)
          if (!nodeSlash) continue
    
          const nextValue = this.getNode(nodeSlash?.id + 1)
          if (nextValue?.expression !== InternalExpression.Path) continue
    
          const key = this.base.getContent(variable)
          const raw = this.getContent(nextValue)
    
          params[key] = this.castValue(raw, type)
        }
      }

      return params as TypedPath['params']
    }
  
    const params: string[] = []
    if (!this.expressions.has(InternalExpression.Variable)) return params
    
    for (let index = 0; index < this.nodes.length; index++) {
      const node = this.nodes[index]
      if (!node || node?.expression !== InternalExpression.Variable) continue
      
      const variable = decodeURIComponentUTF8(this.getContent(node))
      if (variable === null) throw new Error('Variable cannot be null! An error occurred while processing in the decodeURIComponent function!')
      if (params.includes(variable)) {
        throw new Error(`There are two parameters with the same name in the same route! (${this.input})`)
      }
      params.push(variable)
    }

    return params
  }

  /**
   * Returns a Map of search parameters and their values (string or string[] for multiples).
   * @returns {Map<string, string | string[]>} The search parameters map.
   * @example
   * ```ts
   * const analyzer = new Analyze('?a=1&a=2&b=xyz')
   * console.log(analyzer.getSearchParams().get('a')) // ['1','2']
   * console.log(analyzer.getSearchParams().get('b')) // 'xyz'
   * ```
   */
  getSearchParams(this: Analyze<Path, TypedPath, undefined>): Map<string, string | number | boolean | string[]>
  getSearchParams(this: Analyze<Path, TypedPath, Analyze<any>>): TypedPath['searchParams']
  getSearchParams (): Map<string, string | number | boolean | string[]> | TypedPath['searchParams'] {
    /**
     * Caso seja expecificado um parser na variavel this.parser
     */
    if (this.base && this.base.isParser) {
      const params: Record<string, string | number | boolean | string[]> = {}
      if (!this.base.expressions.has(InternalExpression.Parameter)) return params as TypedPath['searchParams']
    
      const definitionMap = this.base.nodes.reduce(
        (map, n) => {
          if (n.expression !== InternalExpression.Parameter) return map
    
          const content = this.base!.getContent(n)
          const type =
            n.type !== InternalExpression.Null
              ? n.type
              : this.base!.getNode(n.id + 1)?.expression === EncodingSymbols.Equal
                ? this.base!.getType(n.id + 2) ?? ContentTypes.String
                : ContentTypes.String
    
          map.set(content, type)
          return map
        },
        new Map<string, ContentTypes>()
      )
    
      for (const node of this.nodes) {
        if (node.expression !== InternalExpression.Parameter) continue
    
        const name = this.getContent(node, this.input)
        const type = definitionMap.get(name)
        if (!type) continue
    
        const raw = this.getValue(node.id) ?? ''
        params[name] = this.castValue(raw, type)
      }
    
      return params as TypedPath['searchParams']
    }
    const params = new Map<string, string | string[]>()
    if (!this.expressions.has(InternalExpression.Parameter)) return params
    
    for (let index = 0; index < this.nodes.length; index++) {
      const node = this.nodes[index]
      if (!node || node?.expression !== InternalExpression.Parameter) continue
      
      const variable = decodeURIComponentUTF8(this.getContent(node))
      if (variable === null) throw new Error('Variable cannot be null! An error occurred while processing in the decodeURIComponent function!')

      index++
      const nextSymbol = this.nodes[index]
      if (!nextSymbol || nextSymbol.expression !== EncodingSymbols.Equal) {
        this.appendParam(params, variable, '')
        continue
      }

      index++
      const nextNode = this.nodes[index]
      if (!nextNode || delimitersValues.includes(nextNode.type as number)
      ) {
        this.appendParam(params, variable, '')
        continue
      }

      const content = this.getContent(nextNode)
      if (content === null) throw new Error('Content cannot be null! An error occurred while processing in the decodeURIComponent function!')

      this.appendParam(params, variable, content)
    }

    return params
  }


  /**
   * Retrieves the fragment identifier from the input URL or template.
   *
   * @remarks
   * The fragment identifier (part after '#') is not sent to the server in HTTP requests
   * because browsers strip it before sending. This method extracts and returns that fragment
   * on the client side only.
   *
   * @returns {string | undefined | Record<string,string | string>}  
   * - When called on a template without a base, returns the fragment string (without '#'), or undefined if none.
   * - When called on a template with a base AST, returns a record mapping the fragment key to its value.
   *
   * @example
   * ```ts
   * const analyzer = new Analyze('http://localhost:3000/page#section1');
   * console.log(analyzer.getFragment()); // 'section1'
   * ```
   */
  getFragment(this: Analyze<Path, TypedPath, undefined>): string | undefined
  getFragment(this: Analyze<Path, TypedPath, Analyze<any>>): TypedPath['fragment']
  getFragment (): string | undefined | TypedPath['fragment'] {
    if (this.base) {
      const output: Record<string, string> = {}

      if (
        this.base.expressions.has(InternalExpression.Fragment)
        && this.expressions.has(InternalExpression.Fragment)
      ) {
        const key = this.base.getNodeByType(InternalExpression.Fragment)
        const fragment = this.getNodeByType(InternalExpression.Fragment)
    
        if (fragment && key) {
          const keyString = this.base.getContent(key)
          const fragmentValue = this.getContent(fragment)

          output[keyString] = fragmentValue
        }
      }

      return output as TypedPath['fragment']
    }

    if (!this.expressions.has(InternalExpression.Fragment)) return
    
    for (let index = 0; index < this.nodes.length; index++) {
      const node = this.nodes[index]
      if (!node || node?.expression !== InternalExpression.Fragment) continue
      
      const variable = decodeURIComponentUTF8(this.getContent(node))
      if (variable === null) throw new Error('Variable cannot be null! An error occurred while processing in the decodeURIComponent function!')
      return variable
    }
  }

  /**
   * Retrieves the pathname (path + variables) from the parsed template.
   * @returns {string} The pathname (e.g., '/users/:id').
   * @example
   * ```ts
   * const analyzer = new Analyze('http://localhost:3000/users/:userId/profile')
   * console.log(analyzer.getPathname()) // '/users/:userId/profile'
   * ```
   */
  getPathname (): string {
    const startPathname = this.nodes.find((node) => node.expression === Delimiters.Slash)
    let path = '/'
    if (!startPathname) return path

    for (let index = startPathname.id + 1; index < this.nodes.length; index++) {
      const node = this.nodes[index]!
      if ([Delimiters.Query, Delimiters.Hash].includes(node.expression as Delimiters)) {
        break
      }

      if ([
        Delimiters.Slash,
        InternalExpression.Path,
        Delimiters.Colon,
        InternalExpression.Variable
      ].includes(node.expression as InternalExpression | Delimiters)) {
        path += this.getContent(node)
      }
    }

    return path
  }

  /**
   * Retrieves the port from the input URL, if present.
   * @returns {string | undefined} The port string, or undefined if none.
   * @example
   * ```ts
   * const analyzer = new Analyze('http://localhost:8080')
   * console.log(analyzer.getPort()) // '8080'
   * ```
   */
  getPort (): string | undefined {
    const node = this.nodes.find((node) => node.expression ===  OriginExpression.Port)
    if (!node) return
    
    return this.getContent(node)
  }

  /**
   * Retrieves the hostname from the input URL.
   * @returns {string | undefined} The hostname, or undefined if not found.
   * @example
   * ```ts
   * const analyzer = new Analyze('https://example.com/path')
   * console.log(analyzer.getHostname()) // 'example.com'
   * ```
   */
  getHostname (): string | undefined {
    const node = this.nodes.find((node) => node.expression === OriginExpression.Hostname)
    if (!node) return
    
    return this.getContent(node)
  }

  /**
   * Retrieves the protocol (http or https) from the input URL.
   * @returns {string | undefined} The protocol, or undefined if not found.
   * @example
   * ```ts
   * const analyzer = new Analyze('https://site.org')
   * console.log(analyzer.getProtocol()) // 'https'
   * ```
   */
  getProtocol (): string | undefined {
    const node = this.nodes.find((node) => node.expression === OriginExpression.Protocol)
    if (!node) return

    return this.getContent(node)
  }

  setParser (base: Parser) {
    this.base = base
    this.isParser = true as Parser extends undefined ? true : false
  }

  /**
   * Serializes the internal Node array into a Buffer representation.
   * @returns {Buffer} The Buffer containing node data.
   */
  getBuffer(): Buffer {
    const buf = Buffer.alloc(this.nodes.length * Node.SIZE)
    this.nodes.forEach((node, i) => node.writeToBuffer(buf, i * Node.SIZE))
    return buf
  }

  /**
   * Casts a raw string value to the given content type or expression null.
   * @private
   * @param {string} raw - The raw string to cast.
   * @param {(ContentTypes | InternalExpression.Null)} type - The target type for casting.
   * @returns {string | number | boolean | string[]} The cast value (boolean, number, array, or string).
   * @throws {Error} If the raw string cannot be cast to the specified type.
   * @example
   * ```ts
   * analyzer['castValue']('true', ContentTypes.Boolean)  // true
   * analyzer['castValue']('3.14', ContentTypes.Number)   // 3.14
   * analyzer['castValue']('a,b,c', ContentTypes.Array)   // ['a','b','c']
   * analyzer['castValue']('hello', ContentTypes.String)  // 'hello'
   * ```
   */
  private castValue(raw: string, type: ContentTypes | InternalExpression.Null): string | number | boolean | string[] {
    switch (type) {
    case ContentTypes.Boolean:
      // accept "true"/"false" or "1"/"0"
      if (/^(?:true|1)$/i.test(raw)) return true
      if (/^(?:false|0)$/i.test(raw)) return false
      throw new Error(`Cannot cast "${raw}" to boolean`)
    case ContentTypes.Number: {
      const n = Number(raw)
    
      if (Number.isNaN(n)) throw new Error(`Cannot cast "${raw}" to number`)
      return n
    }
    case ContentTypes.Array: {
      return raw.split(',')
    }
    case ContentTypes.String:
    default:
      return raw
    }
  }

  /**
   * Adds or appends a parameter value into the map, handling duplicates.
   * 
   * @private
   * @param {Map<string, string | string[]>} map - The map to populate.
   * @param {string} variable - Parameter name.
   * @param {string} content - Parameter value.
   */
  private appendParam (
    map: Map<string, string | string[]>,
    variable: string,
    content: string
  ) {
    const prev = map.get(variable)

    switch (typeof prev) {
    case 'string': {
      map.set(variable, [prev, content])
      return
    }
    case 'undefined': {
      map.set(variable, content)
      return
    }
    default: {
      map.set(variable, [...prev ?? [], content])
      return
    }
    }
  }

  /**
   * Finds a Node by its index or its content string.
   * 
   * @param {string | number} idOrName - Node index or content to search.
   * @param {Node[]} [nodes=this.nodes] - Optional node array to search.
   * @param {?string} [input] - Optional input string context.
   * @returns {Node | undefined} The matching Node or undefined.
   */
  getNode(idOrName: string | number, nodes: Node[] = this.nodes, input?: string): Node | undefined {
    const getById = (id: number) => {
      const node = nodes[id]
      if (!node) return

      return node
    }

    switch (typeof idOrName) {
    case 'string': {
      const id = nodes.findIndex((node) => this.getContent(node, input) === idOrName)
      if (id === -1) return
  
      return getById(id)
    }
    case 'number': {
      return getById(idOrName)
    }
    }
  }

  /**
   * Finds the Nth Node of a given expression type.
   * 
   * @param {AllValues} type - Expression or delimiter type code.
   * @param {number} [position=0] - Zero-based occurrence index.
   * @param {Node[]} [nodes=this.nodes] - Optional node array to search.
   * @returns {Node | undefined} The matching Node or undefined.
   */
  getNodeByType(type: AllValues, position: number = 0, nodes: Node[] = this.nodes): Node | undefined {
    let elements = 0
    for (const node of nodes) {
      if (node.expression === type) {
        if (elements === position) return node
        elements++
      }
    }
  }

  /**
   * Retrieves the declared type of a Node's next value token.
   * 
   * @param {string | number} idOrName - Node index or content to search.
   * @param {Node[]} [nodes=this.nodes] - Optional node array to search.
   * @param {?string} [input] - Optional input string context.
   * @returns {ContentTypes | undefined} The content type code if present.
   */
  getType(idOrName: string | number, nodes: Node[] = this.nodes, input?: string): any {
    const getTypeById = (id: number) => {
      const valueNode = nodes[id]
      if (!valueNode || valueNode.expression !== InternalExpression.Value) return

      return valueNode.type
    }

    switch (typeof idOrName) {
    case 'string': {
      const result = this.getNode(idOrName, nodes, input)
      if (!result) return

      return getTypeById(result.id)
    }
    case 'number': {
      return getTypeById(idOrName)
    }
    }
  }

  /**
   * Extracts raw content string from a Node's start/end positions.
   * 
   * @param {Node} node - The Node to extract from.
   * @param {string} [input=this.input] - Optional input string context.
   * @returns {string} The substring for the node.
   */
  getContent (node: Node, input: string = this.input): string {
    return input.slice(node.start, node.end)
  }

  /**
   * Retrieves the raw value string following a parameter or variable Node.
   * 
   * @param {string | number} idOrName - Node index or content to search.
   * @param {Node[]} [nodes=this.nodes] - Optional node array to search.
   * @param {?string} [input] - Optional input string context.
   * @returns {string | undefined} The raw value, or undefined if absent.
   */
  getValue(idOrName: string | number, nodes: Node[] = this.nodes, input?: string): string | undefined {
    const property = this.getNode(idOrName, nodes, input)
    if (
      !property
      || ![InternalExpression.Parameter, InternalExpression.Variable].includes(property.expression as InternalExpression)
    ) return

    const value = this.getNode(property.id + 2, nodes, input)
    if (
      !value
      || value.expression !== InternalExpression.Value
    ) return

    return this.getContent(value, input)
  }

  /**
   * Prints a formatted table of nodes and colors the path output.
   * 
   * @param {Node[]} [node=this.nodes] - Optional node array to display.
   * @param {string} [input=this.input] - Optional input context for coloring.
   */
  display(node: Node[] = this.nodes, input: string = this.input): string {
    type Row = {
      idx: string;
      symbol: string;
      expr: string;
      type: string;
      start: string;
      end: string;
    };

    // Build raw rows data
    const rows: Row[] = node.map((node, i) => {
      const raw = input.slice(node.start, node.end)
      const sym = colorize(raw, expressionKeyColorMap[node.expression] ?? AnsiColor.White)
      const expr = RawTokens[node.expression] ?? 'Unknown'
      const typ = RawTokens[node.type] ?? ''

      return {
        idx: String(i + 1),
        symbol: sym,
        expr,
        type: typ,
        start: String(node.start),
        end: String(node.end),
      }
    })

    // Define headers
    const headers = {
      idx: 'Id',
      symbol: 'Symbol',
      expr: 'Expression',
      type: 'Type',
      start: 'Start',
      end: 'End',
    } as const

    return renderTable(rows, headers) + '\n\nPath: ' + colorizePath(input, node)
  }

  static parser (input: string) {
    const nodes: Node[] = []
    const foundExpressions = new Set<number>()
    let state: AllValues = InternalExpression.Null
    let tokenStart = 0
    let tokenEnd = 0

    for (let index = 0; index < input.length; index++) {
      const code = input.charCodeAt(index)
      const id = nodes.length
      // const c = input.charAt(index)

      if (!RawTokens[code]) {
        const next = input.charCodeAt(index + 1)
        const isDelimiter = !next || delimitersValues.includes(next) || next === EncodingSymbols.Equal

        if (
          (state === InternalExpression.Path || state === InternalExpression.Variable)
                  && (
                    next === Delimiters.Ampersand
                    || next === Delimiters.Colon
                    || (state !== InternalExpression.Variable && EncodingSymbols.Equal === next)
                  )
        ) {
          throw new Error(`Unexpected content in column ${index + 1}. After im (${RawTokens[state]}) it is not allowed to use (${RawTokens[next]})!`)
        }

        if (state === InternalExpression.Parameter
            && (
              next === Delimiters.Colon
              || next === Delimiters.Slash
              || next === Delimiters.Query
            )) {
          throw new Error(`In column (${index + 1}), a ${RawTokens[next]} (${RawTokens[next]}) cannot be declared after a ${RawTokens[state]}!`)
        }

        if (!isDelimiter) continue
        
        switch (state) {
        case OriginExpression.Port:
        case InternalExpression.Fragment:
        case InternalExpression.Path:
        case InternalExpression.Variable: {
          nodes.push(new Node(id, state, tokenStart, index + 1))
          continue
        }
        case InternalExpression.Null: {
          const content = input.slice(tokenEnd, index + 1)
          tokenEnd = tokenEnd <= tokenStart ? (index + 1) : tokenEnd

          switch (content) {
          case 'http': {
            nodes.push(new Node(id, OriginExpression.Protocol, tokenStart, tokenEnd))
            break
          }
          case 'https': {
            nodes.push(new Node(id, OriginExpression.Protocol, tokenStart, tokenEnd))
            break
          }
          default: {
            if (next !== Delimiters.Colon && next !== Delimiters.Slash) {
              nodes.push(new Node(id, InternalExpression.Parameter, tokenStart, tokenEnd))
              continue
            }
            nodes.push(new Node(id, OriginExpression.Hostname, tokenStart, tokenEnd))

            if (next === Delimiters.Colon) {
              // ignore : of localhost:3000
              index += 2
              tokenStart = index
              state = OriginExpression.Port
            }

            continue
          }
          }
          // ignore :// of http://localhost
          index += 4
          tokenStart = index
          state = OriginExpression.Hostname
          continue
        }
        case OriginExpression.Hostname: {
          nodes.push(new Node(id, state, tokenStart, index + 1))

          if (next === Delimiters.Colon) {
            // ignore : of localhost:3000
            index += 2
            tokenStart = index
            state = OriginExpression.Port
            continue
          }
          
          state = InternalExpression.Null
          continue
        }
        default: {
          tokenEnd = tokenEnd <= tokenStart ? (index + 1) : tokenEnd
          const content = input.slice(tokenStart, tokenEnd)

          switch (content) {
          case 'number': {
            nodes.push(new Node(id, state, tokenStart, tokenEnd, ContentTypes.Number))
            break
          }
          case 'boolean': {
            nodes.push(new Node(id, state, tokenStart, tokenEnd, ContentTypes.Boolean))
            break
          }
          case 'string': {
            nodes.push(new Node(id, state, tokenStart, tokenEnd, ContentTypes.String))
            break
          }
          case 'array': {
            nodes.push(new Node(id, state, tokenStart, tokenEnd, ContentTypes.Array))
            break
          }
          default: {
            nodes.push(new Node(id, state, tokenStart, tokenEnd))
            break
          }
          }

          state = InternalExpression.Null
          continue
        }
        }
      }

      switch (code as AllValues) {
      case Delimiters.Hash: /* # */ {
        state = InternalExpression.Fragment
        break
      }
      case Delimiters.Slash: /* / */ {
        state = InternalExpression.Path
        break
      }
      case Delimiters.Ampersand: /* & */ {
        state = InternalExpression.Parameter
        break
      }
      case Delimiters.Semicolon: /* ; */ {
        state = InternalExpression.Parameter
        break
      }
      case Delimiters.Query: /* ? */ {
        state = InternalExpression.Parameter
        break
      }
      case Delimiters.Colon: /* : */ {
        state = InternalExpression.Variable
        break
      }
      case EncodingSymbols.Equal: /* = */ {
        state = InternalExpression.Value
        break
      }
      }

      nodes.push(new Node(id, code, index, index + 1))
      tokenStart = index + 1
      foundExpressions.add(state)
    }

    return { nodes, expressions: foundExpressions }
  }

  withParser<P extends Analyze<Path, TypedPath, any>>(parser: P): Analyze<Path, TypedPath, P> {
    return new Analyze<Path, TypedPath, P>(this.input, parser)
  }
}