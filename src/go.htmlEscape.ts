import * as hyntax from "hyntax"

export const internal: any = {}
function htmlEscape(template: string) {
  // First, tokenize the template string into HTML syntax tokens.
  // These will be used to figure out where we are (syntactically) in the HTML.
  const tokens = hyntax.tokenize(template).tokens

  return (string: string, node) => {
    // Find the first token which encompasses the begin offset of this AST node.
    // We also have some closure side-effects here for tracking some state
    // based on recent tokens occurring just prior to the token that we find.
    var lastAttrName
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
        return internal.fnForAttrName(lastAttrName)(string)

      // Normal text and everything else are escaped "normally" (for HTML).
      case "token:text":
      default:
        return internal.htmlEscape(string)
    }
  }
}
export default htmlEscape

internal.htmlEscape = (string) => {
  return string
    .replace(/\x00/g, "\uFFFD")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&#34;")
    .replace(/'/g, "&#39;")
    .replace(/\+/g, "&#43;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

internal.uriEscape = (string) => {
  const replacePattern = /(?!%\h\h)[^A-Za-z0-9\-._~!#$&*+,/:;=?@[\]]/g
  return string.replace(replacePattern, (c) => {
    return "%" + c.charCodeAt(0).toString(16);
  })
}

internal.fnForAttrName = (attrName) => {
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
      return internal.uriEscape
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
      return internal.htmlEscape // TODO: "unsafe" escaping
    case "srcdoc":
      return internal.htmlEscape // TODO: no escaping?
    case "srcset":
      return internal.htmlEscape // TODO: special-case srcset escaping
    case "style":
      return internal.htmlEscape // TODO: CSS escaping
    default:
      return internal.htmlEscape
  }
}
