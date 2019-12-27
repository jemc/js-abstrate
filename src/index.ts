export const go = {
  parse: require("./go.parse.ts").parse,
  builtin: require("./go.builtin.ts").builtin,
  interpret: require("./go.interpret.ts").interpret,
  htmlEscape: require("./go.htmlEscape.ts").htmlEscape,
  render: (template: string, data: any, opts: any = {}) => {
    const runtime = {
      builtin: Object.assign(Object.assign({}, opts.functions), go.builtin),
      variableScopes: [opts.variables || {}],
      escapeFn: opts.escapeFn || ((string, node) => { return string }),
    }
    return go.interpret.body(go.parse(template), data, runtime).value.escaped
  },
}

export default {
  go: go,
}
