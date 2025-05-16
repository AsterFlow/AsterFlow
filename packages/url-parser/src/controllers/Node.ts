import { ContentTypes, InternalExpression, type AllValues } from '../types/node'

export class Node {
  static readonly SIZE = 7 as const

  constructor(
    /**
     * @size 1 Byte
     */
    public readonly id: number,
    /**
     * @size 1 Byte
     */
    public expression: AllValues = InternalExpression.Null,
    /**
     * @size 2 Byte
     */
    public start: number = 0,
    /**
     * @size 2 Byte
     */
    public end: number = 0,
    /**
     * @size 1 Byte
     */
    public type: ContentTypes | InternalExpression.Null = 
    ![InternalExpression.Parameter, InternalExpression.Value].includes(this.expression as InternalExpression)
      ? InternalExpression.Null
      : ContentTypes.String
  ) {}

  setExpression (expression: AllValues) {
    this.expression = expression
    return this
  }

  setType (type: ContentTypes) {
    this.type = type
    return this
  }

  setPosition (x1: number, x2: number) {
    this.start = x1
    this.end = x2
    return this
  }

  writeToBuffer(buffer: Buffer, off: number): void {
    buffer.writeUInt8(this.id, off)
    buffer.writeUInt8(this.expression, off + 1)
    buffer.writeUInt16LE(this.start, off + 2)
    buffer.writeUInt16LE(this.end, off + 4)
    buffer.writeUInt8(this.type, off + 6)
  }

  /** read a Node out of a Buffer at byte-offset `off` */
  static fromBuffer(buffer: Buffer): Node[] {
    const nodes: Node[] = []

    for (let off = 0; off < buffer.length; off += Node.SIZE) {
      const id = buffer.readUInt8(off) as AllValues
      const expression = buffer.readUInt8(off + 1) as AllValues
      const start = buffer.readUInt16LE(off + 2)
      const end = buffer.readUInt16LE(off + 4)
      const type = buffer.readUInt16LE(off + 6)
  
      nodes.push(new Node(id, expression, start, end, type))
    }

    return nodes
  }
}