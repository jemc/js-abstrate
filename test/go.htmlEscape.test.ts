import "mocha"
import * as assert from "assert"
import * as Abstrate from "../src"

const render = (template: string, data: any) => {
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

  it("escapes in an HTML content context", () => {
    const result = render(
      `{{.}}`,
      "O'Reilly: How are <i>you</i>?",
    )
    assert.equal(result,
      `O&#39;Reilly: How are &lt;i&gt;you&lt;/i&gt;?`)
  })

  it("escapes in an HTML attribute context", () => {
    const result = render(
      `<a title="{{.}}">`,
      "O'Reilly: How are <i>you</i>?",
    )
    assert.equal(result,
      `<a title="O&#39;Reilly: How are &lt;i&gt;you&lt;/i&gt;?">`
    )
  })

  it("escapes in an HTML URI attribute context", () => {
    const result = render(
      `<a href="/{{.}}">`,
      "O'Reilly: How are <i>you</i>?",
    )
    assert.equal(result,
      `<a href="/O%27Reilly:%20How%20are%20%3ci%3eyou%3c/i%3e?">`
    )
  })

  it("is fully compatible with how the real Go HTML escaping works")
})
