# abstrate

Abstrate is a library for applications that need to analyze and execute templates.

At this time, the only rendering engine is one that compatible with the syntax of [Go templates](https://golang.org/pkg/text/template/).

## Example

The following example demonstrates rendering a simple template (the first argument), including passing in data (the second argument), and custom variables and functions for the runtime environment (the third argument).

```
const Abstrate = require("abstrate")

Abstrate.go.render(
  "{{ $Greeting }}, {{ exclaim .Object }}",
  { Object: "World"},
  {
    variables: { Greeting: "Hello" },
    functions: { exclaim: (string) => { return string + "!" } },
  }
) // => "Hello, World!"
```

We can also parse the template to an intermediate representation (abstract syntax tree) instead of executing it. This allows the use of custom logic to do static analysis on the templates. For example, one could detect which variables are defined or which functions are used within certain blocks of the template.

```
Abstrate = require("abstrate")

Abstrate.go.parse(
  "{{ $Greeting }}, {{ exclaim .Object }}"
) /* =>
  [
    { "type": "variable", "name": "Greeting" },
    { "type": "text", "content": ", " },
    { "type": "invoke",
      "target": { "type": "builtin", "name": "exclaim" },
      "args": [
        {
          "type": "dot",
          "name": "Object",
          "of": { "type": "root" },
        },
      ],
    }
  ]
*/
```

## Known Limitations

The following sections describe known limitations of this library. Given some time and effort invested, these limitations could be overcome. If fixing one of these limitations is a requirement for you, open an issue ticket and you can become the assignee for fixing it.

### Go Templates

- *No HTML-specific escaping/safety rules*. Go uses a rather complicated [context-specific model](https://golang.org/pkg/html/template/#hdr-Contexts) for escaping HTML templates, which has different escaping behavior based on where the templating insertions appear in the HTML syntax, even down to treating certain HTML attribute names as special cases. At this time, Abstrate only supports "text" mode of templates from Go, in which this context-specific escaping is not present.

- *Some standard runtime functions are missing*. Go defines [a set of standard/predefined runtime functions for execution](https://golang.org/pkg/text/template/#hdr-Functions), but at this time, Abstrate only implements a subset of them. PRs are welcome to add more of them, as needed. Note that it is also easy to add custom runtime functions to the Abstrate rendering call, so even if a function you need is missing, you are not immediately blocked from using it because you can define it yourself at the caller side if pressed.


