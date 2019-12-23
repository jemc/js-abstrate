///
// This grammar implements a syntax compatible with Go templates.
// See https://golang.org/pkg/text/template/

{
  // Define a convenience function for "spreading" location info into a node.
  // (i.e. `...loc()`)
  function loc() {
    const loc = location()
    return {
      beginOffset: loc.start.offset,
      finalOffset: loc.end.offset,
    }
  }
}

///
// The root of the template may be text only, or it may be a mixture of text
// and template expression blocks.

root = roottmpl / roottextonly

roottmpl
  = first:textfirst ws list:(text / expr)* ws last:textlast
    {
      let result = []
      if (first.content.length > 0) { result.push(first) }
      list.forEach((x) => {
        if (x.type != "text" || x.content.length > 0) { result.push(x) }
      })
      if (last.content.length > 0) { result.push(last) }
      return result
    }

roottextonly
  = content:textbody
    {
      if (content.content.length > 0) {
        return [{ type: "text", ...content }]
      } else {
        return []
      }
    }

///
// A text area is any arbitrary characters, delimited by "mustaches".

text
  = left:textbegin content:textbody right:textend
    { return { type: "text", ...content, ...left, ...right } }

textfirst
  = content:textbody right:textend
    { return { type: "text", ...content, ...right } }

textlast
  = left:textbegin content:textbody
    { return { type: "text", ...content, ...left } }

textend
  = "{{-" { return { trimRight: true } }
  / "{{" { return {} }

textbegin
  = "-}}" { return { trimLeft: true } }
  / "}}" { return {} }

textbody "text"
  = chars:textchar* { return { content: chars.join(""), ...loc() } }

textchar
  = !textend char:anychar { return char }

///
// A template expression is code, found within the "mustache" blocks.

expr "expression"
  = ws body:substbody ws { return body }

substbody
  = withblock
  / ifblock
  / rangeblock
  / blockblock
  / declare
  / assign
  / pipeline
  / invalid

atom
  = number
  / variable
  / string
  / stringraw
  / stringchar
  / parens

parens
  = "(" ws term:pipeline ws ")" { return term }

///
// Some template expressions are blocks with an "end" marker,
// and sometimes a kind of middle marker (i.e. "else").

withblock "with block"
  = "with" term:expr body:blockbody elseBody:blockelsebody? blockend
    { return { type: "with", term: term, body: body, elseBody: elseBody || [], ...loc() } }

ifblock "if block"
  = ifelseifblock
  / "if" term:expr body:blockbody elseBody:blockelsebody? blockend
    { return { type: "if", term: term, body: body, elseBody: elseBody || [], ...loc() } }

ifelseifblock
  = "if" term:expr body:blockbody ws "else " ws elseBody:ifblock
    { return { type: "if", term: term, body: body, elseBody: elseBody, ...loc() } }

rangeblock "range block"
  = rangewithdeclareindexandvalueblock
  / rangewithdeclarevalueblock
  / "range" term:expr body:rangeblockbody
    { return { type: "range", term: term, ...body, ...loc() } }

rangewithdeclarevalueblock
  = "range" ws value:variable ws ":=" ws term:expr body:rangeblockbody
    { return { type: "range", declareValue: value, term: term, ...body, ...loc() } }

rangewithdeclareindexandvalueblock
  = "range" ws index:variable ws "," ws value:variable ws ":=" ws term:expr body:rangeblockbody
    { return { type: "range", declareIndex: index, declareValue: value, term: term, ...body, ...loc() } }

rangeblockbody
  = body:blockbody elseBody:blockelsebody? blockend
    { return { body: body, elseBody: elseBody || [] } }

blockblock "block block"
  = "block" term:expr body:blockbody blockend
    { return { type: "block", term: term, body: body, ...loc() } }

blockelsebody
  = blockelse body:blockbody { return body }

blockbody "block body"
  = first:text lists:(blockexpr text)* {
      var result = []
      if (first.content.length > 0) { result.push(first) }
      lists.forEach((list) => {
        list.forEach((x) => {
          if (x.type != "text" || x.content.length > 0) { result.push(x) }
        })
      })
      return result
    }

blockexpr
  = !blockelse !blockend expr:expr { return expr }

blockelse "else"
  = ws body:"else" ws

blockend "end"
  = ws body:"end" ws

///
// Sometimes we need to declare or assign a variable.

declare "variable declaration"
  = "$" name:ident ws ":=" value:expr
    { return { type: "declare", name: name, value: value, ...loc() } }

assign "variable assignation"
  = "$" name:ident ws "=" value:expr
    { return { type: "assign", name: name, value: value, ...loc() } }

variable
  = "$" name:(ident / "")
    { return { type: "variable", name: name, ...loc() } }

///
// Pipelines are complex expressions that can contain things piped into things,
// invocations of things, dot chains, a single dot, or any other atom.

pipeline "pipeline"
  = first:pipelineexpr rest:(ws "|" ws pipelineexpr)* {
    var root = first
    rest.forEach((r) => {
      root = { type: "pipe", from: root, to: r[3], ...loc() }
    })
    return root
  }

pipelineexpr "pipeline expression"
  = pipelineinvoke

pipelinedotident
  = "." name:ident { return name }

pipelinedots
  = ws root:atom? names:pipelinedotident+ ws {
    var root = root || { type: "root", ...loc() }
    names.forEach((name) => {
      root = { type: "dot", of: root, name: name, ...loc() }
    })
    return root
  }

pipelineinvoke
  = target:pipelineinvoketarget args:pipelineinvokearg* {
    if (args.length == 0) {
      return target
    } else {
      return { type: "invoke", target: target, args: args, ...loc() }
    }
  }

pipelineinvoketarget
  = pipelineinvoketargetbuiltin
  / pipelinedots
  / pipelineroot
  / atom

pipelineinvoketargetbuiltin
  = name:ident
    { return { type: "builtin", name: name, ...loc() } }

pipelineroot
  = ws "." ws { return { type: "root", ...loc() } }

pipelineinvokearg
  = ws term:(
      pipelineinvoketarget
    ) ws
    { return term }

///
// If we failed to parse a template, capture the invalid expression here.

invalid
  = chars:invalidchar+
    { return { type: "invalid", content: chars.join(""), ...loc() } }

invalidchar
  = !textbegin char:anychar { return char }

///
// An identifier starts with a letter or underscore, and is followed by
// some combination of letters, numbers, and/or underscores.

ident "identifier"
  = first:[A-Za-z_] rest:[0-9A-Za-z_]* { return [first, ...rest].join("") }

///
// A number literal is parseable as a floating-point number.

number "number"
  = ("-" / "+")? numberint numberfrac? numberexp?
    { return { type: "number", value: parseFloat(text()), ...loc() } }

numberexp
  = [eE] ("-" / "+")? [0-9]+

numberfrac
  = "." [0-9]+

numberint
  = "0" / ([1-9] [0-9]*)

///
// String literals have a beginning and ending delimiter.

// TODO: handle escaping, treat differently from one another
string
  = "\"" chars:[^"]* "\"" {
    return { type: "string", content: chars.join(""), ...loc() }
  }

// TODO: handle escaping, treat differently from one another
stringraw
  = "`" chars:[^`]* "`" {
    return { type: "string", content: chars.join(""), ...loc() }
  }

// TODO: handle escaping, treat differently from one another
stringchar
  = "'" chars:[^']* "'" {
    return { type: "char", content: chars.join(""), ...loc() }
  }

///
// Whitespace is optional in many places, and comments can be included in it.

comment "comment"
  = commentbegin chars:commentchar+ commentend
    { return { type: "comment", content: chars.join(""), ...loc() } }

commentchar
  = !commentend char:anychar { return char }

commentbegin
  = "/*"

commentend
  = "*/"

ws "whitespace" = (comment / [ \t\n\r])*

///
// Remaining odds and ends / building blocks

anychar
  = [^\0-\x1F\x22\x5C]
  / [ \t\n\r]
  / '"'
  / "\\" sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b" }
      / "f" { return "\f" }
      / "n" { return "\n" }
      / "r" { return "\r" }
      / "t" { return "\t" }
      / "u" digits:$(hexdigit hexdigit hexdigit hexdigit) {
          return String.fromCharCode(parseInt(digits, 16))
        }
    )
    { return sequence }

hexdigit = [0-9a-f]i
