export const Interpret: any = {}
export default Interpret

export interface IGoInterpretRuntime {
  builtin: object
  variableScopes: Array<object>
  escapeFn(string: string, node: any): string
}

// To escape a result, invoke the escapeFn function unless instructed not to.
Interpret._maybeEscape = (result: any, runtime: IGoInterpretRuntime) => {
  if (result.value.alreadyEscaped) {
    return result.value.escaped
  } else {
    return runtime.escapeFn(result.value, result.from)
  }
}

// To interpret a scope, begin the scope, interpret the body, and end the scope.
Interpret.scope = (nodes: any[], data: any, runtime: IGoInterpretRuntime) => {
  runtime.variableScopes.unshift({})
  const result = Interpret.body(nodes, data, runtime)
  runtime.variableScopes.shift()
  return result
}

// To interpret a body, interpret the nodes then flatten them to a string value.
Interpret.body = (nodes: any[], data: any, runtime: IGoInterpretRuntime) => {
  const escapedValue =
    Interpret.nodes(nodes, data, runtime).reduce((accum: string, chunk: any) => {
      return accum + Interpret._maybeEscape(chunk, runtime)
    }, "")
  const value = { alreadyEscaped: true, escaped: escapedValue }
  return { value: value, from: nodes }
}

// To interpret a list of nodes, interpret each node and return the list.
Interpret.nodes = (nodes: any[], data: any, runtime: IGoInterpretRuntime) => {
  return nodes.map((node) => { return Interpret.node(node, data, runtime) })
}

// To interpret a node, delegate to the type-specific function for that node.
Interpret.node = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  if (node.type in Interpret) {
    return { value: Interpret[node.type](node, data, runtime), from: node }
  } else {
    throw new Error("NOT IMPLEMENTED: go.interpret for type: " + node.type)
  }
}

// A text node returns the raw text content of the node (a string).
// The trimLeft/trimRight options specify to trim leading/trailing whitespace.
Interpret.text = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  let value = node.content
  if (node.trimLeft) { value = value.replace(/^\s+/, "") }
  if (node.trimRight) { value = value.replace(/\s+$/, "") }
  return { alreadyEscaped: true, escaped: value }
}

// A number node returns the number value as a number.
Interpret.number = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  return node.value
}

// A string node returns the string content as a string.
Interpret.string = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  return node.content
}

// A root node simply returns the root of the data passed in.
Interpret.root = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  return data
}

// A declare node introduces a new variable to the runtime, with a value.
// Throws an error if a variable with this name was already declared.
// Returns an empty string, so as not to affect the template output.
Interpret.declare = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  const value = Interpret.node(node.value, data, runtime).value
  // We always declare a variable in the current (innermost) scope in the stack.
  const variables: any = runtime.variableScopes[0]
  variables[node.name] = value
  return ""
}

// An assign node sets a new value for a variable already known to the runtime.
// Throws an error if no variable with this name was already declared.
// Returns an empty string, so as not to affect the template output.
Interpret.assign = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  const value = Interpret.node(node.value, data, runtime).value
  // Search each variable scope in the stack, starting with the innermost scope.
  for (const variables of runtime.variableScopes) {
    // If this is the scope where the variable is, assign the value and return.
    if (node.name in variables) {
      (variables as any)[node.name] = value
      return ""
    }
  }
  // If we reach this, we didn't find the variable in the entire scope stack.
  throw new Error("template variable not known in this scope: $" + node.name)
}

// A variable node returns the current value of the named variable.
Interpret.variable = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  // Search each variable scope in the stack, starting with the innermost scope.
  for (const variables of runtime.variableScopes) {
    // If this is the scope where the variable is, return the current value.
    if (node.name in variables) {
      return (variables as any)[node.name]
    }
  }
  // If we reach this, we didn't find the variable in the entire scope stack.
  throw new Error("template variable not known in this scope: $" + node.name)
}

// A block block interprets the body of the block in a nested scope.
Interpret.block = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  return Interpret.scope(node.body, data, runtime).value
}

// An if block interprets either the body or elseBody, based on its term.
Interpret.if = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  if (Interpret.node(node.term, data, runtime).value) {
    return Interpret.scope(node.body, data, runtime).value
  } else {
    return Interpret.scope(node.elseBody, data, runtime).value
  }
}

// A range block interprets the body once for each element in the term.
// The "root" data within the block context is the value of the element.
// If there are zero elements, the elseBody is interpreted instead.
// Throws an error if the term is not an array.
Interpret.range = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  const list = Interpret.node(node.term, data, runtime).value
  if (Array.isArray(list)) {
    if (list.length > 0) {
      let index = 0
      let escapedValue = ""
      list.forEach((element) => {
        const extraVars = {}
        if (node.declareValue) {
          (extraVars as any)[node.declareValue.name] = element
        }
        if (node.declareIndex) {
          (extraVars as any)[node.declareIndex.name] = index
          index = index + 1
        }
        runtime.variableScopes.unshift(extraVars)
        const chunk = Interpret.scope(node.body, element, runtime)
        escapedValue = escapedValue + Interpret._maybeEscape(chunk, runtime)
        runtime.variableScopes.shift()
      })
      return { alreadyEscaped: true, escaped: escapedValue }
    } else {
      return Interpret.scope(node.elseBody, data, runtime).value
    }
  } else {
    throw new Error("can't range over a value that is not an array: " +
      JSON.stringify(list))
  }
}

// A dot node returns the named member of the data passed in.
Interpret.dot = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  const object = Interpret.node(node.of, data, runtime).value
  if (typeof object === "object" && node.name in object) {
    return object[node.name]
  } else {
    throw new Error("attribute \"" + node.name + "\" not found within: " +
      JSON.stringify(object))
  }
}

// A builtin node retrieves a given named thing from the runtime.
Interpret.builtin = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  if (node.name in runtime.builtin) {
    return (runtime.builtin as any)[node.name]
  } else {
    throw new Error("builtin \"" + node.name + "\" not found within runtime: " +
      JSON.stringify(runtime))
  }
}

// An invoke node calls its target as a function with the given args' values.
Interpret.invoke = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  const target = Interpret.node(node.target, data, runtime).value
  if (typeof target === "function") {
    const args = node.args.map((arg: any) => {
      return Interpret.node(arg, data, runtime).value
    })
    return Reflect.apply(target, undefined, args)
  } else {
    throw new Error("can't invoke because the target is not a function:" +
      JSON.stringify(node))
  }
}

// A pipe node is syntax sugar for an invoke node.
// When the right side is an invoke, the left side is added as another arg.
// Otherwise, the right side becomes the target for the invoke.
Interpret.pipe = (node: any, data: any, runtime: IGoInterpretRuntime) => {
  if (node.to.type === "invoke") {
    const invoke = node.to
    return Interpret.invoke({
      type: "invoke",
      target: invoke.target,
      args: [...invoke.args, node.from],
    }, data, runtime)
  } else {
    return Interpret.invoke({
      type: "invoke",
      target: node.to,
      args: [node.from],
    }, data, runtime)
  }
}

