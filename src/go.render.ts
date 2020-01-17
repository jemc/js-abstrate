import * as AST from './go.ast'
import { parse as goParse } from "./go.parse"
import goBuiltin from "./go.builtin"
import goInterpret from "./go.interpret"

export interface IGoRenderOptions {
  functions?: object
  variables?: object
  escapeFn?: (string: string, node: any) => string
}

function render(template: string, data: object, opts: IGoRenderOptions = {}) {
  const runtime = {
    builtin: Object.assign(Object.assign({}, opts.functions), goBuiltin),
    variableScopes: [opts.variables || {}],
    escapeFn: opts.escapeFn || ((string, node) => { return string }),
  }
  const nodes: Array<AST.Any> = goParse(template)
  return goInterpret.body(nodes, data, runtime).value.escaped
}

export default render
