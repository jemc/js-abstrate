const assert = require("assert")
const Abstrate = require("../src")

describe("Abstrate.go.render", () => {
  it("renders a simple dot construct", () => {
    result = Abstrate.go.render(
      "{{.X}}",
      { "X": "example" },
    )
    assert.equal(result, "example")
  })
})
