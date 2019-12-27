import { parse as goParse } from "./go.parse"
import goBuiltin from "./go.builtin"
import goInterpret from "./go.interpret"

function render(template: string, data: any, opts: any = {}) {
  const runtime = {
    builtin: Object.assign(Object.assign({}, opts.functions), goBuiltin),
    variableScopes: [opts.variables || {}],
    escapeFn: opts.escapeFn || ((string, node) => { return string }),
  }
  return goInterpret.body(goParse(template), data, runtime).value.escaped
}

export default render
