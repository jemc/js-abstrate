import { parse as goParse } from "./go.parse"
import goBuiltin from "./go.builtin"
import goInterpret from "./go.interpret"
import goHtmlEscape from "./go.htmlEscape"
import goRender from "./go.render"

export const go = {
  parse: goParse,
  builtin: goBuiltin,
  interpret: goInterpret,
  htmlEscape: goHtmlEscape,
  render: goRender,
}

export default go
