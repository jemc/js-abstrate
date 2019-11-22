"use strict"

const interpret = {}
module.exports = interpret

interpret.terms = (terms, data, runtime) => {
  return terms.map((term) => { return interpret.term(term, data, runtime) })
}

interpret.term = (term, data, runtime) => {
  if (term.type in interpret) {
    return { value: interpret[term.type](term, data, runtime), from: term }
  } else {
    throw new Error("NOT IMPLEMENTED: go.interpret for type: " + term.type)
  }
}

interpret.root = (term, data, runtime) => {
  return data
}

interpret.dot = (term, data, runtime) => {
  return interpret.term(term.of, data, runtime).value[term.name]
}
