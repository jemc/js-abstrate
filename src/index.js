"use strict";

const go = require("./go.js")
go.runtime = require("./go.runtime.js")
go.interpret = require("./go.interpret.js")

go.render = (template, data, extraRuntime) => {
  const runtime = Object.assign(Object.assign({}, go.runtime), extraRuntime)
  return go.interpret.body(go.parse(template), data, runtime).value
}

module.exports = {
  go: go,
}
