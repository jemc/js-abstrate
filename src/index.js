"use strict";

const go = require("./go.js")
go.runtime = { bar: "baz" }
go.interpret = require("./go.interpret.js")

go.render = (template, data, extraRuntime) => {
  const runtime = Object.assign(go.runtime, extraRuntime)
  let result = ""
  go.interpret.terms(go.parse(template), data, runtime).forEach((chunk) => {
    result = result + chunk.value
  })
  return result
}

module.exports = {
  go: go,
}
