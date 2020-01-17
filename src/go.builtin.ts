export const builtin = {
  // Some constant immediate values that can be referenced.
  true: true,
  false: false,
  nil: null,

// Returns true if the left and right arguments are equal.
  eq: (left: any, right: any) => {
    return left === right
  },

  // Returns a string, interpolating the arguments according to the format string.
  // See docs at https://golang.org/pkg/fmt/
  printf: (format: string, ...args: any[]) => {
    const pattern = printfFormatSpecPattern()
    let result = ""
    let priorIndex = 0
    let argIndex = 0

    var matchedArray
    while ((matchedArray = pattern.exec(format)) !== null) {
      const matched = matchedArray[0]
      const startIndex = pattern.lastIndex - matched.length
      const finishIndex = pattern.lastIndex
      const textBefore = format.substring(priorIndex, startIndex)
      const formatSpec = format.substring(startIndex, finishIndex)

      if (argIndex >= args.length) {
        throw new Error("too few arguments passed to printf: " +
          JSON.stringify([format, ...args]))
      }
      const arg = args[argIndex]
      const replacement = printfFormatSpecReplace(formatSpec, arg)

      argIndex = argIndex + 1
      priorIndex = finishIndex
      result = result + textBefore + replacement
    }

    const textAfter = format.substring(priorIndex)
    result = result + textAfter

    if (argIndex < args.length) {
      throw new Error("too many arguments passed to printf: " +
        JSON.stringify([format, ...args]))
    }

    return result
  },
}
export default builtin

// Returns a RegExp pattern that matches a valid printf format specifier.
function printfFormatSpecPattern() {
  const pattern = "%s" // for now, we only support the simple `%s` specifier.
  return RegExp(pattern, "g")
}

// Returns the string to use for formatting the given argument
// with the given format specifier string (matched from the above pattern).
function printfFormatSpecReplace(formatSpec: string, arg: any) {
  if (formatSpec === "%s") {
    return arg
  } else {
    throw new Error("NOT IMPLEMENTED: printf format specifier: " + formatSpec)
  }
}
