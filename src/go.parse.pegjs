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

  function withLoc(node: any) {
    const loc = location()
    node.beginOffset = loc.start.offset
    node.finalOffset = loc.end.offset
    return node
  }
}

///
// The root of the template may be text only, or it may be a mixture of text
// and template expression blocks.

root = roottmpl / roottextonly

roottmpl
  = first:textfirst ws list:(text / expr)* ws last:textlast
    {
      let result: any[] = []
      if (first.content.length > 0) { result.push(first) }
      list.forEach((x: any) => {
        if (x.type != "text" || x.content.length > 0) { result.push(x) }
      })
      if (last.content.length > 0) { result.push(last) }
      return result
    }

roottextonly
  = content:textbody
    {
      if (content.content.length > 0) {
        return [content]
      } else {
        return []
      }
    }

///
// A text area is any arbitrary characters, delimited by "mustaches".

text
  = left:textbegin text:textbody right:textend
    {
      if (left.trim)  { text.trimLeft  = true }
      if (right.trim) { text.trimRight = true }
      return text
    }

textfirst
  = text:textbody right:textend
    {
      if (right.trim) { text.trimRight = true }
      return text
    }

textlast
  = left:textbegin text:textbody
    {
      if (left.trim)  { text.trimLeft = true }
      return text
    }

textend
  = "{{-" { return { trim: true } }
  / "{{" { return {} }

textbegin
  = "-}}" { return { trim: true } }
  / "}}" { return {} }

textbody "text"
  = chars:textchar* { return withLoc(new AST.Text(chars.join(""))) }

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
    { return withLoc(new AST.With(term, body, elseBody || [])) }

ifblock "if block"
  = ifelseifblock
  / "if" term:expr body:blockbody elseBody:blockelsebody? blockend
    { return withLoc(new AST.If(term, body, elseBody || [])) }

ifelseifblock
  = "if" term:expr body:blockbody ws "else " ws elseIf:ifblock
    { return withLoc(new AST.If(term, body, [elseIf])) }

rangeblock "range block"
  = rangewithdeclareindexandvalueblock
  / rangewithdeclarevalueblock
  / "range" term:expr body:blockbody elseBody:blockelsebody? blockend
    { return withLoc(new AST.Range(term, body, elseBody || [])) }

rangewithdeclarevalueblock
  = "range" ws value:variable ws ":=" ws term:expr body:blockbody elseBody:blockelsebody? blockend
    {
      const node = withLoc(new AST.Range(term, body, elseBody || []))
      node.declareValue = value
      return node
    }

rangewithdeclareindexandvalueblock
  = "range" ws index:variable ws "," ws value:variable ws ":=" ws term:expr body:blockbody elseBody:blockelsebody? blockend
    {
      const node = withLoc(new AST.Range(term, body, elseBody || []))
      node.declareIndex = index
      node.declareValue = value
      return node
    }

blockblock "block block"
  = "block" term:expr body:blockbody blockend
    { return withLoc(new AST.Block(term as AST.Any, body as Array<AST.Any>)) }

blockelsebody
  = blockelse body:blockbody { return body }

blockbody "block body"
  = first:text lists:(blockexpr text)* {
      let result: any[] = []
      if (first.content.length > 0) { result.push(first) }
      lists.forEach((list: any[]) => {
        list.forEach((x: any) => {
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
    { return withLoc(new AST.Declare(name, value as AST.Any)) }

assign "variable assignation"
  = "$" name:ident ws "=" value:expr
    { return withLoc(new AST.Assign(name, value as AST.Any)) }

variable
  = "$" name:(ident / "")
    { return withLoc(new AST.Variable(name)) }

///
// Pipelines are complex expressions that can contain things piped into things,
// invocations of things, dot chains, a single dot, or any other atom.

pipeline "pipeline"
  = first:pipelineexpr rest:(ws "|" ws pipelineexpr)* {
    var root = first as AST.Any
    rest.forEach((r: any) => {
      root = withLoc(new AST.Pipe(root as AST.Any, r[3] as AST.Any))
    })
    return root
  }

pipelineexpr "pipeline expression"
  = pipelineinvoke

pipelinedotident
  = "." name:ident { return name }

pipelinedots
  = ws first:atom? names:pipelinedotident+ ws {
    let root: AST.Any = (first || withLoc(new AST.Root)) as AST.Any
    names.forEach((name: string) => {
      root = withLoc(new AST.Dot(root as AST.Any, name))
    })
    return root
  }

pipelineinvoke
  = target:pipelineinvoketarget args:pipelineinvokearg* {
    if (args.length == 0) {
      return target
    } else {
      return withLoc(new AST.Invoke(target as AST.Any, args as Array<AST.Any>))
    }
  }

pipelineinvoketarget
  = pipelineinvoketargetbuiltin
  / pipelinedots
  / pipelineroot
  / atom

pipelineinvoketargetbuiltin
  = name:ident
    { return withLoc(new AST.Builtin(name)) }

pipelineroot
  = ws "." ws { return withLoc(new AST.Root()) }

pipelineinvokearg
  = ws term:(
      pipelineinvoketarget
    ) ws
    { return term }

///
// If we failed to parse a template, capture the invalid expression here.

invalid
  = chars:invalidchar+
    { return withLoc(new AST.Invalid(chars.join(""))) }

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
    { return withLoc(new AST.Number(parseFloat(text()))) }

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
    return withLoc(new AST.String(chars.join("")))
  }

// TODO: handle escaping, treat differently from one another
stringraw
  = "`" chars:[^`]* "`" {
    return withLoc(new AST.String(chars.join("")))
  }

// TODO: handle escaping, treat differently from one another
stringchar
  = "'" chars:[^']* "'" {
    return withLoc(new AST.Char(chars.join("")))
  }

///
// Whitespace is optional in many places, and comments can be included in it.

comment "comment"
  = commentbegin chars:commentchar+ commentend
    { return withLoc(new AST.Comment(chars.join(""))) }

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
