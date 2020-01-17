import { parse } from "./go.parse"
import { builtin } from "./go.builtin"
import { interpret } from "./go.interpret"
import { htmlEscape } from "./go.htmlEscape"
import { render } from "./go.render"

export const go = {
  parse: parse,
  builtin: builtin,
  interpret: interpret,
  htmlEscape: htmlEscape,
  render: render,
}

export default go
