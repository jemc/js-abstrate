"use strict"

const interpret = {}
module.exports = interpret

// To interpret a body, interpret the nodes then flatten them to a string value.
interpret.body = (nodes, data, runtime) => {
  let value = ""
  interpret.nodes(nodes, data, runtime).forEach((chunk) => {
    value = value + chunk.value
  })
  return { value: value, from: nodes }
}

// To interpret a list of nodes, interpret each node and return the list.
interpret.nodes = (nodes, data, runtime) => {
  return nodes.map((node) => { return interpret.node(node, data, runtime) })
}

// To interpret a node, delegate to the type-specific function for that node.
interpret.node = (node, data, runtime) => {
  if (node.type in interpret) {
    return { value: interpret[node.type](node, data, runtime), from: node }
  } else {
    throw new Error("NOT IMPLEMENTED: go.interpret for type: " + node.type)
  }
}

// A text node returns the raw text content of the node (a string).
// The trimLeft/trimRight options specify to trim leading/trailing whitespace.
interpret.text = (node, data, runtime) => {
  let value = node.content
  if (node.trimLeft) { value = value.replace(/^\s+/, "") }
  if (node.trimRight) { value = value.replace(/\s+$/, "") }
  return value
}

// A string node returns the string content as a string.
// TODO: handle escaping?
interpret.string = (node, data, runtime) => {
  return node.content
}

// A root node simply returns the root of the data passed in.
interpret.root = (node, data, runtime) => {
  return data
}

// A declare node introduces a new variable to the runtime, with a value.
// Throws an error if a variable with this name was already declared.
// Returns an empty string, so as not to affect the template output.
interpret.declare = (node, data, runtime) => {
  const value = interpret.node(node.value, data, runtime).value
  const variables = runtime['$'] = runtime['$'] || {}
  if (node.name in variables) {
    throw new Error("template variable already declared: $" + node.name)
  }
  variables[node.name] = { value: value, from: node }
  return ""
}

// A variable node returns the current value of the named variable.
interpret.variable = (node, data, runtime) => {
  const variables = runtime['$'] = runtime['$'] || {}
  if (node.name in variables) {
    return variables[node.name].value
  } else {
    throw new Error("template variable not known in this scope: $" + node.name)
  }
}

// An if block interprets either the body or elseBody, based on its term.
interpret.if = (node, data, runtime) => {
  if (interpret.node(node.term, data, runtime).value) {
    return interpret.body(node.body, data, runtime).value
  } else {
    return interpret.body(node.elseBody, data, runtime).value
  }
}

// A dot node returns the named member of the data passed in.
interpret.dot = (node, data, runtime) => {
  const object = interpret.node(node.of, data, runtime).value
  if (typeof object === "object" && node.name in object) {
    return object[node.name]
  } else {
    throw new Error("attribute \"" + node.name + "\" not found within: " +
      JSON.stringify(object))
  }
}
