"use strict"

const runtime = {}
module.exports = runtime

// Returns true if the left and right arguments are equal.
runtime.eq = (left, right) => {
  return left === right
}
