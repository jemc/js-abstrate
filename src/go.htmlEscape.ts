import * as hyntax from "hyntax"

export function htmlEscape(template: string) {
  // First, tokenize the template string into HTML syntax tokens.
  // These will be used to figure out where we are (syntactically) in the HTML.
  const tokens = hyntax.tokenize(template).tokens

  return (string: string, node: any) => {
    // Find the first token which encompasses the begin offset of this AST node.
    // We also have some closure side-effects here for tracking some state
    // based on recent tokens occurring just prior to the token that we find.
    let lastAttrName: string = ""
    const token = tokens.find((token) => {
      // As a side-effect, capture the attribute name if this token is one.
      if (token.type == "token:attribute-key") {
        lastAttrName = token.content
      }

      // Return true if this token encompasses the beginning of this AST node.
      return token.endPosition > node.beginOffset
        && token.startPosition < node.beginOffset
    })!

    // Based on the token type we found, use the correct escaping approach.
    switch (token.type) {
      // Attribute values are escaped based on the name of the attribute.
      case "token:attribute-value":
        return escapeFnForAttr(lastAttrName)(string)

      // Normal text and everything else are escaped "normally" (for HTML).
      case "token:text":
      default:
        return escapeAsHTML(string)
    }
  }
}

export default htmlEscape

interface IEscapeFn {
  (string: string): string
}

function escapeAsHTML(string: string): string {
  return string
    .replace(/\x00/g, "\uFFFD")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&#34;")
    .replace(/'/g, "&#39;")
    .replace(/\+/g, "&#43;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeAsURI(string: string): string {
  const replacePattern = /(?!%\h\h)[^A-Za-z0-9\-._~!#$&*+,/:;=?@[\]]/g
  return string.replace(replacePattern, (c) => {
    return "%" + c.charCodeAt(0).toString(16);
  })
}

function escapeFnForAttr(attrName: string): IEscapeFn {
  // See https://www.w3.org/TR/html5/Overview.html#attributes-1
  // See https://www.w3.org/TR/html4/index/attributes.html
  switch (attrName) {
    case "action":
    case "archive":
    case "background":
    case "cite":
    case "classid":
    case "codebase":
    case "data":
    case "formaction":
    case "href":
    case "icon":
    case "longdesc":
    case "manifest":
    case "poster":
    case "profile":
    case "src":
    case "usemap":
    case "xmlns":
      return escapeAsURI
    case "accept-charset":
    case "async":
    case "challenge":
    case "charset":
    case "content":
    case "crossorigin":
    case "defer":
    case "enctype":
    case "form":
    case "formenctype":
    case "formmethod":
    case "formnovalidate":
    case "http-equiv":
    case "keytype":
    case "language":
    case "method":
    case "novalidate":
    case "pattern":
    case "rel":
    case "sandbox":
    case "type":
    case "value":
      return escapeAsHTML // TODO: "unsafe" escaping
    case "srcdoc":
      return escapeAsHTML // TODO: no escaping?
    case "srcset":
      return escapeAsHTML // TODO: special-case srcset escaping
    case "style":
      return escapeAsHTML // TODO: CSS escaping
    default:
      return escapeAsHTML
  }
}
