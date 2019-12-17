"use strict"
const assert = require("assert")
const Abstrate = require("../src")

const render = (template, data) => {
  return Abstrate.go.render(template, data, {
    escapeFn: Abstrate.go.htmlEscape(template),
  })
}

describe("Abstrate.go.htmlEscape", () => {
  ///
  // The following examples were taken from this Go template documentation:
  //   https://golang.org/pkg/html/template/#hdr-Contexts
  // However, the documented outputs are actually *wrong* in some cases,
  // so the actual output was captured and verified using this sandbox:
  //   https://play.golang.org/p/Snlfy8bQg8g

  it("escapes in an html content context", () => {
    const result = render(
      "{{.}}",
      "O'Reilly: How are <i>you</i>?",
    )
    assert.equal(result, "O&#39;Reilly: How are &lt;i&gt;you&lt;/i&gt;?")
  })

  it("is fully compatible with how the real Go HTML escaping works")
})
