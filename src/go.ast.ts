export type Any =
  Root |
  Invalid |
  Builtin |
  Variable |
  Number |
  String |
  Char |
  Comment |
  Text |
  Invoke |
  Dot |
  Pipe |
  Declare |
  Assign |
  Block |
  If |
  With |
  Range

export default Any

export abstract class Base {
  beginOffset: number = 0
  finalOffset: number = 0
}

export class Root extends Base {
  type = "root" as const
}

export class Invalid extends Base {
  type = "invalid" as const
  constructor(
    public content: string,
  ) { super() }
}

export class Builtin extends Base {
  type = "builtin" as const
  constructor(
    public name: string,
  ) { super() }
}

export class Variable extends Base {
  type = "variable" as const
  constructor(
    public name: string,
  ) { super() }
}

export class Number extends Base {
  type = "number" as const
  constructor(
    public value: number,
  ) { super() }
}

export class String extends Base {
  type = "string" as const
  constructor(
    public content: string,
  ) { super() }
}

export class Char extends Base {
  type = "char" as const
  constructor(
    public content: string,
  ) { super() }
}

export class Comment extends Base {
  type = "comment" as const
  constructor(
    public content: string,
  ) { super() }
}

export class Text extends Base {
  type = "text" as const
  public trimLeft?: boolean
  public trimRight?: boolean
  constructor(
    public content: string,
  ) { super() }
}

export class Invoke extends Base {
  type = "invoke" as const
  constructor(
    public target: Any,
    public args: Array<Any>,
  ) { super() }
}

export class Dot extends Base {
  type = "dot" as const
  constructor(
    public of: Any,
    public name: string,
  ) { super() }
}

export class Pipe extends Base {
  type = "pipe" as const
  constructor(
    public from: Any,
    public to: Any,
  ) { super() }
}

export class Declare extends Base {
  type = "declare" as const
  constructor(
    public name: string,
    public value: Any,
  ) { super() }
}

export class Assign extends Base {
  type = "assign" as const
  constructor(
    public name: string,
    public value: Any,
  ) { super() }
}

export class Block extends Base {
  type = "block" as const
  constructor(
    public term: Any,
    public body: Array<Any>,
  ) { super() }
}

export class If extends Base {
  type = "if" as const
  constructor(
    public term: Any,
    public body: Array<Any>,
    public elseBody: Array<Any>,
  ) { super() }
}

export class With extends Base {
  type = "with" as const
  constructor(
    public term: Any,
    public body: Array<Any>,
    public elseBody: Array<Any>,
  ) { super() }
}

export class Range extends Base {
  type = "range" as const
  public declareIndex?: Variable
  public declareValue?: Variable
  constructor(
    public term: Any,
    public body: Array<Any>,
    public elseBody: Array<Any>,
  ) { super() }
}

///
// Define a visitor mechanism allowing us to use the discriminated type.
// See this blog post for more info:
//   https://medium.com/@fillopeter/pattern-matching-with-typescript-done-right-94049ddd671c
export type AnyType = Any["type"]
export type AnyMap<U> = {
  [K in AnyType]: U extends {type: K} ? U : never
}
export type AnyTypeMap = AnyMap<Any>
export type AnyPattern<T> = {
  [K in keyof AnyTypeMap]: (shape: AnyTypeMap[K]) => T
}
export function visitor<T>(pattern: AnyPattern<T>): (node: Any) => T {
  return node => pattern[node.type](node as any)
}
