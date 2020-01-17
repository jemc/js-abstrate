import * as AST from './go.ast'
import { parse } from "./go.parse"
import { builtin } from "./go.builtin"
import { interpret } from "./go.interpret"

export interface IGoRenderOptions {
  functions?: object
  variables?: object
  escapeFn?: (string: string, node: AST.Any | Array<AST.Any>) => string
}

export function render(template: string, data: object, opts: IGoRenderOptions = {}) {
  const runtime = {
    builtin: Object.assign(Object.assign({}, opts.functions), builtin),
    variableScopes: [opts.variables || {}],
    escapeFn: opts.escapeFn || ((string, node) => { return string }),
  }
  const nodes: Array<AST.Any> = parse(template)
  return interpret.body(nodes, data, runtime).value.escaped
}

export default render
