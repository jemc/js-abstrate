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

    result = Abstrate.go.render(template, { Formal: true })
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
})
