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
})
