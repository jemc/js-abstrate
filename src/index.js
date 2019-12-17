"use strict";

const go = require("./go.js")
go.builtin = require("./go.builtin.js")
go.interpret = require("./go.interpret.js")

go.render = (template, data, opts = {}) => {
  const runtime = {
    builtin: Object.assign(Object.assign({}, opts.functions), go.builtin),
    variables: opts.variables || {},
    escapeFn: (x) => { return x },
  }
  return go.interpret.body(go.parse(template), data, runtime).value.escaped
}

module.exports = {
  go: go,
}
