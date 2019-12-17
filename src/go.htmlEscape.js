"use strict"

const internal = {}

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

module.exports = (template) => {
  return (string, node) => {
    return internal.htmlEscape(string)
  }
}
