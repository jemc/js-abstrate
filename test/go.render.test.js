"use strict"
const assert = require("assert")
const Abstrate = require("../src")

describe("Abstrate.go.render", () => {
  it("renders a simple dot attribute", () => {
    const result = Abstrate.go.render(
      "Hello, {{ .Subject }}!",
      { Subject: "World" },
    )
    assert.equal(result, "Hello, World!")
  })

  it("renders chains of dot attributes", () => {
    const result = Abstrate.go.render(
      "{{ .Animal.Name }} is a {{ .Animal.Color.Name }} {{ .Animal.Kind }}.",
      { Animal: { Name: "Roy", Color: { Name: "red" }, Kind: "rattlesnake" } },
    )
    assert.equal(result, "Roy is a red rattlesnake.")
  })

  it("renders text blocks with leading whitespace trimmed from them", () => {
    const result = Abstrate.go.render(
      " \t \n 1 \t \n {{ .A -}} \t \n 2 \t \n {{ .B -}} \t \n 3 \t \n ",
      { A: "a", B: "b" },
    )
    assert.equal(result, " \t \n 1 \t \n a2 \t \n b3 \t \n ")
  })

  it("renders text blocks with trailing whitespace trimmed from them", () => {
    const result = Abstrate.go.render(
      " \t \n 1 \t \n {{- .A }} \t \n 2 \t \n {{- .B }} \t \n 3 \t \n ",
      { A: "a", B: "b" },
    )
    assert.equal(result, " \t \n 1a \t \n 2b \t \n 3 \t \n ")
  })

  it("renders text blocks based on boolean conditions", () => {
    var result
    const template =
      "{{if .Formal}}Hello{{else}}Yo{{end}}, World{{if .Exclaim}}!{{end}}"

    result = Abstrate.go.render(template, { Formal: true, Exclaim: false })
    assert.equal(result, "Hello, World")

    result = Abstrate.go.render(template, { Formal: false, Exclaim: true })
    assert.equal(result, "Yo, World!")
  })

  it("renders text blocks in a range-based loop", () => {
    var result
    const template =
      "Animals:\n{{ range .Animals }}- {{ .Color }} {{ .Kind }}\n{{ end }}"

    result = Abstrate.go.render(template, { Animals: [
      { Color: "red", Kind: "fox" },
      { Color: "green", Kind: "iguana" },
      { Color: "blue", Kind: "fish" },
    ] })
    assert.equal(result, "Animals:\n- red fox\n- green iguana\n- blue fish\n")

    result = Abstrate.go.render(template, { Animals: [] })
    assert.equal(result, "Animals:\n")
  })

  it("renders an else block in a range loop when no items are present", () => {
    var result
    const template =
      "{{ range .Chars }}{{ . }}{{ else }}?{{ end }}!"

    result = Abstrate.go.render(template, { Chars: ["Y", "a", "y"] })
    assert.equal(result, "Yay!")

    result = Abstrate.go.render(template, { Chars: [] })
    assert.equal(result, "?!")
  })

  it("renders the value of a prior defined variable", () => {
    const result = Abstrate.go.render(
      "{{ $subject := `World` }}Hello, {{ $subject }}!",
      {},
    )
    assert.equal(result, "Hello, World!")
  })

  it("throws an error when a variable is not yet declared", () => {
    assert.throws(() => {
      Abstrate.go.render(
        "{{ $x := `x` }}{{ $y }}",
        {},
      )
    }, { message: "template variable not known in this scope: $y" })
  })

  it("throws an error when a variable is declared more than once", () => {
    assert.throws(() => {
      Abstrate.go.render(
        "{{ $x := `x` }}{{ $y := `y` }}{{ $x := `X` }}",
        {},
      )
    }, { message: "template variable already declared: $x" })
  })

  it("throws an error when an attribute is not found", () => {
    assert.throws(() => {
      Abstrate.go.render(
        "{{ .Valid1.Bogus1.Bogus2 }}!",
        { Valid1: { Valid2: true } },
      )
    }, { message: 'attribute "Bogus1" not found within: {"Valid2":true}' })
  })

  it("allows re-assigning a variable to a new value", () => {
    const result = Abstrate.go.render(
      `{{ $subject := "World" -}}
      {{ if .Universal }}{{ $subject = "Universe" }}{{ end -}}
      Hello, {{ $subject }}!`,
      { Universal: true },
    )
    assert.equal(result, "Hello, Universe!")
  })

  it("throws an error when assigning to a variable not yet declared", () => {
    assert.throws(() => {
      Abstrate.go.render(
        "{{ $x = `x` }}",
        {},
      )
    }, { message: "template variable not known in this scope: $x" })
  })

  it("pipes the left side into an invocation of the right side", () => {
    const testFn = (arg) => { return `okay: ${arg}` }

    const result = Abstrate.go.render(
      "{{ `example` | testFn }}",
      {},
      { functions: { testFn: testFn } },
    )
    assert.equal(result, "okay: example")
  })

  it("pipes the left as a final arg when the right already invokes", () => {
    const testFn = (...args) => { return `okay: ${JSON.stringify(args)}` }

    const result = Abstrate.go.render(
      "{{ `three` | testFn `one` `two` }}",
      {},
      { functions: { testFn: testFn } },
    )
    assert.equal(result, "okay: [\"one\",\"two\",\"three\"]")
  })

  it("supports builtin immediate values like true and false", () => {
    const testFn = (trueValue, falseValue, nilValue) => {
      assert.equal(trueValue, true)
      assert.equal(falseValue, false)
      assert.equal(nilValue, null)
      return "okay"
    }

    const result = Abstrate.go.render(
      "{{ testFn true false nil }}",
      {},
      { functions: { testFn: testFn } },
    )
    assert.equal(result, "okay")
  })

  it("supports number values", () => {
    const testFn = (numberValue) => {
      assert.equal(numberValue, 36)
      return `okay: ${numberValue}`
    }

    const result = Abstrate.go.render(
      "{{ testFn 36 }}",
      {},
      { functions: { testFn: testFn } },
    )
    assert.equal(result, "okay: 36")
  })

  it("invokes eq to test equality of strings", () => {
    var result
    const template =
      "{{if eq .State `FINE`}}This is fine...{{else}}What?{{end}}"

    result = Abstrate.go.render(template, { State: "FINE" })
    assert.equal(result, "This is fine...")

    result = Abstrate.go.render(template, { State: "fine" })
    assert.equal(result, "What?")

    result = Abstrate.go.render(template, { State: "something else" })
    assert.equal(result, "What?")
  })

  it("is fully compatible with how the real Go `eq` function works")

  it("invokes printf to concatenate some strings", () => {
    const result = Abstrate.go.render(
      "{{ printf `I guess %s %s %s...` .Word1 .Word2 .Word3 }}",
      { Word1: "this", Word2: "is", Word3: "fine" },
    )
    assert.equal(result, "I guess this is fine...")
  })

  it("throws an error when invoking printf with too few arguments", () => {
    assert.throws(() => {
      Abstrate.go.render(
        "{{ printf `%s %s %s` `one` `two` }}",
        {},
      )
    }, /too few arguments passed to printf/)
  })

  it("throws an error when invoking printf with too many arguments", () => {
    assert.throws(() => {
      Abstrate.go.render(
        "{{ printf `%s %s %s` `one` `two` `three` `four` }}",
        {},
      )
    }, /too many arguments passed to printf/)
  })

  it("is fully compatible with how the real Go `printf` function works")

  it("mutates the variables object to show the results of execution", () => {
    const vars = { Example1: "one" }
    Abstrate.go.render("{{ $Example2 := `two` }}", {}, { variables: vars })
    assert.equal(vars["Example1"], "one")
    assert.equal(vars["Example2"], "two")
  })

  it("renders the example from the README", () => {
    const result = Abstrate.go.render(
      "{{ $Greeting }}, {{ exclaim .Object }}",
      { Object: "World"},
      {
        variables: { Greeting: "Hello" },
        functions: { exclaim: (string) => { return string + "!" } },
      }
    )
    assert.equal(result, "Hello, World!")
  })
})
