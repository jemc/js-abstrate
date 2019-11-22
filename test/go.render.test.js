const assert = require("assert")
const Abstrate = require("../src")

describe("Abstrate.go.render", () => {
  it("renders a simple dot construct", () => {
    result = Abstrate.go.render(
      "Hello, {{ .Subject }}!",
      { Subject: "World" },
    )
    assert.equal(result, "Hello, World!")
  })

  it("renders text blocks with leading whitespace trimmed from them", () => {
    result = Abstrate.go.render(
      " \t \n 1 \t \n {{ .A -}} \t \n 2 \t \n {{ .B -}} \t \n 3 \t \n ",
      { A: "a", B: "b" },
    )
    assert.equal(result, " \t \n 1 \t \n a2 \t \n b3 \t \n ")
  })

  it("renders text blocks with trailing whitespace trimmed from them", () => {
    result = Abstrate.go.render(
      " \t \n 1 \t \n {{- .A }} \t \n 2 \t \n {{- .B }} \t \n 3 \t \n ",
      { A: "a", B: "b" },
    )
    assert.equal(result, " \t \n 1a \t \n 2b \t \n 3 \t \n ")
  })

  it("renders text blocks based on boolean conditions", () => {
    const template =
      "{{if .Formal}}Hello{{else}}Yo{{end}}, World{{if .Exclaim}}!{{end}}"

    result = Abstrate.go.render(template, { Formal: true })
    assert.equal(result, "Hello, World")

    result = Abstrate.go.render(template, { Formal: false, Exclaim: true })
    assert.equal(result, "Yo, World!")
  })
})
