"use strict";

const go = require("./go.js")
go.builtin = require("./go.builtin.js")
go.interpret = require("./go.interpret.js")
go.htmlEscape = require("./go.htmlEscape.js")

go.render = (template, data, opts = {}) => {
  const runtime = {
    builtin: Object.assign(Object.assign({}, opts.functions), go.builtin),
    variableScopes: [opts.variables || {}],
    escapeFn: opts.escapeFn || ((string, node) => { return string }),
  }
  return go.interpret.body(go.parse(template), data, runtime).value.escaped
}

module.exports = {
  go: go,
}
