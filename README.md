# abstrate

Abstrate is a library for applications that need to analyze and execute templates.

At this time, the only rendering engine is one that compatible with the syntax of [Go templates](https://golang.org/pkg/text/template/).

## Example

The following example demonstrates rendering a simple template (the first argument), including passing in data (the second argument), and custom variables and functions for the runtime environment (the third argument).

```js
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

```js
Abstrate = require("abstrate")

Abstrate.go.parse(
  "{{ $Greeting }}, {{ exclaim .Object }}"
) /* =>
  [
    {
      type: "variable",
      name: "Greeting",
      beginOffset: 3,
      finalOffset: 12,
    },
    {
      type: "text",
      content: ", ",
      beginOffset: 15,
      finalOffset: 17,
    },
    {
      type: "invoke",
      target: {
        type: "builtin",
        name: "exclaim",
        beginOffset: 20,
        finalOffset: 27,
      },
      args: [
        {
          type: "dot",
          of: {
            type: "root",
            beginOffset: 28,
            finalOffset: 36,
          },
          name: "Object",
          beginOffset: 28,
          finalOffset: 36,
        }
      ],
      beginOffset: 20,
      finalOffset: 36,
    }
  ]
*/
```

## Known Limitations

The following sections describe known limitations of this library. Given some time and effort invested, these limitations could be overcome. If fixing one of these limitations is a requirement for you, open an issue ticket and you can become the assignee for fixing it.

### Go Templates

- *HTML-specific escaping/safety rules are only partially implemented*. Go uses a rather complicated [context-specific model](https://golang.org/pkg/html/template/#hdr-Contexts) for escaping HTML templates, which has different escaping behavior based on where the templating insertions appear in the HTML syntax, even down to treating certain HTML attribute names as special cases. At this time, Abstrate only fully supports "text" mode of templates from Go, but a partially-implemented HTML escaping mode is available. See [the `go.htmlEscape` tests](./test/go.htmlEscape.test.js) if you want to give it a try, or if you want to contribute improvements.

- *Some standard runtime functions are missing*. Go defines [a set of standard/predefined runtime functions for execution](https://golang.org/pkg/text/template/#hdr-Functions), but at this time, Abstrate only implements a subset of them. PRs are welcome to add more of them, as needed. Note that it is also easy to add custom runtime functions to the Abstrate rendering call, so even if a function you need is missing, you are not immediately blocked from using it because you can define it yourself at the caller side if pressed.
