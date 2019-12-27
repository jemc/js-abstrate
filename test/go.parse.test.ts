import assert from "assert"
import Abstrate from "../src"

// A utility function for easily printing the result of a parse call.
const show = (x) => { console.log(JSON.stringify(x, null, 2)) }

describe("Abstrate.go.parse", () => {
  ///
  // Test cases from https://github.com/golang/go/blob/bbbc6589dfbc05be2bfa59f51c20f9eaa8d0c531/src/text/template/parse/parse_test.go

  it("parses an empty template", () => {
    const result = Abstrate.go.parse(
      ""
    )
    assert.deepEqual(result, [])
  })

  it("parses an otherwise empty template containing only a comment", () => {
    const result = Abstrate.go.parse(
      "{{/*\n\n\n*/}}"
    )
    assert.deepEqual(result, [])
  })

  it("parses whitespace characters in the text", () => {
    const result = Abstrate.go.parse(
      " \t\n"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": " \t\n",
        "beginOffset": 0,
        "finalOffset": 3
      }
    ])
  })

  it("parses some text", () => {
    const result = Abstrate.go.parse(
      "some text"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "some text",
        "beginOffset": 0,
        "finalOffset": 9
      }
    ])
  })

  it("parses a simple dot construct", () => {
    const result = Abstrate.go.parse(
      "{{.X}}"
    )
    assert.deepEqual(result, [
      {
        "type": "dot",
        "of": {
          "type": "root",
          "beginOffset": 2,
          "finalOffset": 4
        },
        "name": "X",
        "beginOffset": 2,
        "finalOffset": 4
      }
    ])
  })

  it("parses a dot chain", () => {
    const result = Abstrate.go.parse(
      "{{.X.Y.Z}}"
    )
    assert.deepEqual(result, [
      {
        "type": "dot",
        "of": {
          "type": "dot",
          "of": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 2,
              "finalOffset": 8
            },
            "name": "X",
            "beginOffset": 2,
            "finalOffset": 8
          },
          "name": "Y",
          "beginOffset": 2,
          "finalOffset": 8
        },
        "name": "Z",
        "beginOffset": 2,
        "finalOffset": 8
      }
    ])
  })

  it("parses a builtin identifier", () => {
    const result = Abstrate.go.parse(
      "{{printf}}"
    )
    assert.deepEqual(result, [
      {
        "type": "builtin",
        "name": "printf",
        "beginOffset": 2,
        "finalOffset": 8
      }
    ])
  })

  it("parses an empty variable", () => {
    const result = Abstrate.go.parse(
      "{{$}}"
    )
    assert.deepEqual(result, [
      {
        "type": "variable",
        "name": "",
        "beginOffset": 2,
        "finalOffset": 3
      }
    ])
  })

  it("parses a with block that declares a variable then invokes it", () => {
    const result = Abstrate.go.parse(
      "{{with $x := 3}}{{$x 23}}{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "with",
        "term": {
          "type": "declare",
          "name": "x",
          "value": {
            "type": "number",
            "value": 3,
            "beginOffset": 13,
            "finalOffset": 14
          },
          "beginOffset": 7,
          "finalOffset": 14
        },
        "body": [
          {
            "type": "invoke",
            "target": {
              "type": "variable",
              "name": "x",
              "beginOffset": 18,
              "finalOffset": 20
            },
            "args": [
              {
                "type": "number",
                "value": 23,
                "beginOffset": 21,
                "finalOffset": 23
              }
            ],
            "beginOffset": 18,
            "finalOffset": 23
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 30
      }
    ])
  })

  it("parses a dot member of a variable", () => {
    const result = Abstrate.go.parse(
      "{{$.I}}"
    )
    assert.deepEqual(result, [
      {
        "type": "dot",
        "of": {
          "type": "variable",
          "name": "",
          "beginOffset": 2,
          "finalOffset": 3
        },
        "name": "I",
        "beginOffset": 2,
        "finalOffset": 5
      }
    ])
  })

  it("parses a builtin invocation with raw string and number args", () => {
    const result = Abstrate.go.parse(
      "{{printf `%d` 23}}"
    )
    assert.deepEqual(result, [
      {
        "type": "invoke",
        "target": {
          "type": "builtin",
          "name": "printf",
          "beginOffset": 2,
          "finalOffset": 8
        },
        "args": [
          {
            "type": "string",
            "content": "%d",
            "beginOffset": 9,
            "finalOffset": 13
          },
          {
            "type": "number",
            "value": 23,
            "beginOffset": 14,
            "finalOffset": 16
          }
        ],
        "beginOffset": 2,
        "finalOffset": 16
      }
    ])
  })

  it("parses a simple pipeline construct", () => {
    const result = Abstrate.go.parse(
      "{{.X|.Y}}"
    )
    assert.deepEqual(result, [
      {
        "type": "pipe",
        "from": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 2,
            "finalOffset": 4
          },
          "name": "X",
          "beginOffset": 2,
          "finalOffset": 4
        },
        "to": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 5,
            "finalOffset": 7
          },
          "name": "Y",
          "beginOffset": 5,
          "finalOffset": 7
        },
        "beginOffset": 2,
        "finalOffset": 7
      }
    ])
  })

  it("parses a variable declaration whose value comes from a pipeline", () => {
    const result = Abstrate.go.parse(
      "{{$x := .X|.Y}}"
    )
    assert.deepEqual(result, [
      {
        "type": "declare",
        "name": "x",
        "value": {
          "type": "pipe",
          "from": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 8,
              "finalOffset": 10
            },
            "name": "X",
            "beginOffset": 8,
            "finalOffset": 10
          },
          "to": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 11,
              "finalOffset": 13
            },
            "name": "Y",
            "beginOffset": 11,
            "finalOffset": 13
          },
          "beginOffset": 8,
          "finalOffset": 13
        },
        "beginOffset": 2,
        "finalOffset": 13
      }
    ])
  })

  it("parses a complex construct of invocations, dots, and pipelines", () => {
    const result = Abstrate.go.parse(
      "{{.X (.Y .Z) (.A | .B .C) (.E)}}"
    )
    assert.deepEqual(result, [
      {
        "type": "invoke",
        "target": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 2,
            "finalOffset": 5
          },
          "name": "X",
          "beginOffset": 2,
          "finalOffset": 5
        },
        "args": [
          {
            "type": "invoke",
            "target": {
              "type": "dot",
              "of": {
                "type": "root",
                "beginOffset": 6,
                "finalOffset": 9
              },
              "name": "Y",
              "beginOffset": 6,
              "finalOffset": 9
            },
            "args": [
              {
                "type": "dot",
                "of": {
                  "type": "root",
                  "beginOffset": 9,
                  "finalOffset": 11
                },
                "name": "Z",
                "beginOffset": 9,
                "finalOffset": 11
              }
            ],
            "beginOffset": 6,
            "finalOffset": 11
          },
          {
            "type": "pipe",
            "from": {
              "type": "dot",
              "of": {
                "type": "root",
                "beginOffset": 14,
                "finalOffset": 17
              },
              "name": "A",
              "beginOffset": 14,
              "finalOffset": 17
            },
            "to": {
              "type": "invoke",
              "target": {
                "type": "dot",
                "of": {
                  "type": "root",
                  "beginOffset": 19,
                  "finalOffset": 22
                },
                "name": "B",
                "beginOffset": 19,
                "finalOffset": 22
              },
              "args": [
                {
                  "type": "dot",
                  "of": {
                    "type": "root",
                    "beginOffset": 22,
                    "finalOffset": 24
                  },
                  "name": "C",
                  "beginOffset": 22,
                  "finalOffset": 24
                }
              ],
              "beginOffset": 19,
              "finalOffset": 24
            },
            "beginOffset": 14,
            "finalOffset": 24
          },
          {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 27,
              "finalOffset": 29
            },
            "name": "E",
            "beginOffset": 27,
            "finalOffset": 29
          }
        ],
        "beginOffset": 2,
        "finalOffset": 30
      }
    ])
  })

  it("parses a dot member of a parenthesized invocation", () => {
    const result = Abstrate.go.parse(
      "{{(.Y .Z).Field}}"
    )
    assert.deepEqual(result, [
      {
        "type": "dot",
        "of": {
          "type": "invoke",
          "target": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 3,
              "finalOffset": 6
            },
            "name": "Y",
            "beginOffset": 3,
            "finalOffset": 6
          },
          "args": [
            {
              "type": "dot",
              "of": {
                "type": "root",
                "beginOffset": 6,
                "finalOffset": 8
              },
              "name": "Z",
              "beginOffset": 6,
              "finalOffset": 8
            }
          ],
          "beginOffset": 3,
          "finalOffset": 8
        },
        "name": "Field",
        "beginOffset": 2,
        "finalOffset": 15
      }
    ])
  })

  it("parses a simple if block", () => {
    const result = Abstrate.go.parse(
      "{{if .X}}hello{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "if",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 5,
            "finalOffset": 7
          },
          "name": "X",
          "beginOffset": 5,
          "finalOffset": 7
        },
        "body": [
          {
            "type": "text",
            "content": "hello",
            "beginOffset": 9,
            "finalOffset": 14
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 19
      }
    ])
  })

  it("parses an if block with else block", () => {
    const result = Abstrate.go.parse(
      "{{if .X}}true{{else}}false{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "if",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 5,
            "finalOffset": 7
          },
          "name": "X",
          "beginOffset": 5,
          "finalOffset": 7
        },
        "body": [
          {
            "type": "text",
            "content": "true",
            "beginOffset": 9,
            "finalOffset": 13
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "false",
            "beginOffset": 21,
            "finalOffset": 26
          }
        ],
        "beginOffset": 2,
        "finalOffset": 31
      }
    ])
  })

  it("parses an if block with else if block", () => {
    const result = Abstrate.go.parse(
      "{{if .X}}true{{else if .Y}}false{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "if",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 5,
            "finalOffset": 7
          },
          "name": "X",
          "beginOffset": 5,
          "finalOffset": 7
        },
        "body": [
          {
            "type": "text",
            "content": "true",
            "beginOffset": 9,
            "finalOffset": 13
          }
        ],
        "elseBody": {
          "type": "if",
          "term": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 23,
              "finalOffset": 25
            },
            "name": "Y",
            "beginOffset": 23,
            "finalOffset": 25
          },
          "body": [
            {
              "type": "text",
              "content": "false",
              "beginOffset": 27,
              "finalOffset": 32
            }
          ],
          "elseBody": [],
          "beginOffset": 20,
          "finalOffset": 37
        },
        "beginOffset": 2,
        "finalOffset": 37
      }
    ])
  })

  it("parses an if block with else and else if blocks", () => {
    const result = Abstrate.go.parse(
      "+{{if .X}}X{{else if .Y}}Y{{else if .Z}}Z{{end}}+"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "+",
        "beginOffset": 0,
        "finalOffset": 1
      },
      {
        "type": "if",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 6,
            "finalOffset": 8
          },
          "name": "X",
          "beginOffset": 6,
          "finalOffset": 8
        },
        "body": [
          {
            "type": "text",
            "content": "X",
            "beginOffset": 10,
            "finalOffset": 11
          }
        ],
        "elseBody": {
          "type": "if",
          "term": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 21,
              "finalOffset": 23
            },
            "name": "Y",
            "beginOffset": 21,
            "finalOffset": 23
          },
          "body": [
            {
              "type": "text",
              "content": "Y",
              "beginOffset": 25,
              "finalOffset": 26
            }
          ],
          "elseBody": {
            "type": "if",
            "term": {
              "type": "dot",
              "of": {
                "type": "root",
                "beginOffset": 36,
                "finalOffset": 38
              },
              "name": "Z",
              "beginOffset": 36,
              "finalOffset": 38
            },
            "body": [
              {
                "type": "text",
                "content": "Z",
                "beginOffset": 40,
                "finalOffset": 41
              }
            ],
            "elseBody": [],
            "beginOffset": 33,
            "finalOffset": 46
          },
          "beginOffset": 18,
          "finalOffset": 46
        },
        "beginOffset": 3,
        "finalOffset": 46
      },
      {
        "type": "text",
        "content": "+",
        "beginOffset": 48,
        "finalOffset": 49
      }
    ])
  })

  it("parses a simple range block", () => {
    const result = Abstrate.go.parse(
      "{{range .X}}hello{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 8,
            "finalOffset": 10
          },
          "name": "X",
          "beginOffset": 8,
          "finalOffset": 10
        },
        "body": [
          {
            "type": "text",
            "content": "hello",
            "beginOffset": 12,
            "finalOffset": 17
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 22
      }
    ])
  })

  it("parses range block with dot chain term", () => {
    const result = Abstrate.go.parse(
      "{{range .X.Y.Z}}hello{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "term": {
          "type": "dot",
          "of": {
            "type": "dot",
            "of": {
              "type": "dot",
              "of": {
                "type": "root",
                "beginOffset": 8,
                "finalOffset": 14
              },
              "name": "X",
              "beginOffset": 8,
              "finalOffset": 14
            },
            "name": "Y",
            "beginOffset": 8,
            "finalOffset": 14
          },
          "name": "Z",
          "beginOffset": 8,
          "finalOffset": 14
        },
        "body": [
          {
            "type": "text",
            "content": "hello",
            "beginOffset": 16,
            "finalOffset": 21
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 26
      }
    ])
  })

  it("parses nested range blocks", () => {
    const result = Abstrate.go.parse(
      "{{range .X}}hello{{range .Y}}goodbye{{end}}{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 8,
            "finalOffset": 10
          },
          "name": "X",
          "beginOffset": 8,
          "finalOffset": 10
        },
        "body": [
          {
            "type": "text",
            "content": "hello",
            "beginOffset": 12,
            "finalOffset": 17
          },
          {
            "type": "range",
            "term": {
              "type": "dot",
              "of": {
                "type": "root",
                "beginOffset": 25,
                "finalOffset": 27
              },
              "name": "Y",
              "beginOffset": 25,
              "finalOffset": 27
            },
            "body": [
              {
                "type": "text",
                "content": "goodbye",
                "beginOffset": 29,
                "finalOffset": 36
              }
            ],
            "elseBody": [],
            "beginOffset": 19,
            "finalOffset": 41
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 48
      }
    ])
  })

  it("parses a range block with else block", () => {
    const result = Abstrate.go.parse(
      "{{range .X}}true{{else}}false{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 8,
            "finalOffset": 10
          },
          "name": "X",
          "beginOffset": 8,
          "finalOffset": 10
        },
        "body": [
          {
            "type": "text",
            "content": "true",
            "beginOffset": 12,
            "finalOffset": 16
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "false",
            "beginOffset": 24,
            "finalOffset": 29
          }
        ],
        "beginOffset": 2,
        "finalOffset": 34
      }
    ])
  })

  it("parses a range block whose term is a pipeline", () => {
    const result = Abstrate.go.parse(
      "{{range .X|.M}}true{{else}}false{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "term": {
          "type": "pipe",
          "from": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 8,
              "finalOffset": 10
            },
            "name": "X",
            "beginOffset": 8,
            "finalOffset": 10
          },
          "to": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 11,
              "finalOffset": 13
            },
            "name": "M",
            "beginOffset": 11,
            "finalOffset": 13
          },
          "beginOffset": 8,
          "finalOffset": 13
        },
        "body": [
          {
            "type": "text",
            "content": "true",
            "beginOffset": 15,
            "finalOffset": 19
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "false",
            "beginOffset": 27,
            "finalOffset": 32
          }
        ],
        "beginOffset": 2,
        "finalOffset": 37
      }
    ])
  })

  it("parses a range block with root value reference inside it", () => {
    const result = Abstrate.go.parse(
      "{{range .SI}}{{.}}{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 8,
            "finalOffset": 11
          },
          "name": "SI",
          "beginOffset": 8,
          "finalOffset": 11
        },
        "body": [
          {
            "type": "root",
            "beginOffset": 15,
            "finalOffset": 16
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 23
      }
    ])
  })

  it("parses a range block whose term is a variable declaration", () => {
    const result = Abstrate.go.parse(
      "{{range $x := .SI}}{{.}}{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "declareValue": {
          "type": "variable",
          "name": "x",
          "beginOffset": 8,
          "finalOffset": 10
        },
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 14,
            "finalOffset": 17
          },
          "name": "SI",
          "beginOffset": 14,
          "finalOffset": 17
        },
        "body": [
          {
            "type": "root",
            "beginOffset": 21,
            "finalOffset": 22
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 29
      }
    ])
  })

  it("parses a range block that declares for both index and value", () => {
    const result = Abstrate.go.parse(
      "{{range $x, $y := .SI}}{{.}}{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "declareIndex": {
          "type": "variable",
          "name": "x",
          "beginOffset": 8,
          "finalOffset": 10
        },
        "declareValue": {
          "type": "variable",
          "name": "y",
          "beginOffset": 12,
          "finalOffset": 14
        },
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 18,
            "finalOffset": 21
          },
          "name": "SI",
          "beginOffset": 18,
          "finalOffset": 21
        },
        "body": [
          {
            "type": "root",
            "beginOffset": 25,
            "finalOffset": 26
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 33
      }
    ])
  })

  it("parses an... imaginary number literal?") // TODO: {{range .SI 1 -3.2i true false 'a' nil}}{{end}}

  it("parses a range block over an invocation with many literal args", () => {
    const result = Abstrate.go.parse(
      "{{range .SI 1 -3.2 true false 'a' nil}}{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "range",
        "term": {
          "type": "invoke",
          "target": {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 8,
              "finalOffset": 12
            },
            "name": "SI",
            "beginOffset": 8,
            "finalOffset": 12
          },
          "args": [
            {
              "type": "number",
              "value": 1,
              "beginOffset": 12,
              "finalOffset": 13
            },
            {
              "type": "number",
              "value": -3.2,
              "beginOffset": 14,
              "finalOffset": 18
            },
            {
              "type": "builtin",
              "name": "true",
              "beginOffset": 19,
              "finalOffset": 23
            },
            {
              "type": "builtin",
              "name": "false",
              "beginOffset": 24,
              "finalOffset": 29
            },
            {
              "type": "char",
              "content": "a",
              "beginOffset": 30,
              "finalOffset": 33
            },
            {
              "type": "builtin",
              "name": "nil",
              "beginOffset": 34,
              "finalOffset": 37
            }
          ],
          "beginOffset": 8,
          "finalOffset": 37
        },
        "body": [],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 44
      }
    ])
  })

  it("parses a template invocation", () => {
    const result = Abstrate.go.parse(
      "{{template `x`}}"
    )
    assert.deepEqual(result, [
      {
        "type": "invoke",
        "target": {
          "type": "builtin",
          "name": "template",
          "beginOffset": 2,
          "finalOffset": 10
        },
        "args": [
          {
            "type": "string",
            "content": "x",
            "beginOffset": 11,
            "finalOffset": 14
          }
        ],
        "beginOffset": 2,
        "finalOffset": 14
      }
    ])
  })

  it("parses a template invocation with additional args", () => {
    const result = Abstrate.go.parse(
      "{{template `x` .Y}}"
    )
    assert.deepEqual(result, [
      {
        "type": "invoke",
        "target": {
          "type": "builtin",
          "name": "template",
          "beginOffset": 2,
          "finalOffset": 10
        },
        "args": [
          {
            "type": "string",
            "content": "x",
            "beginOffset": 11,
            "finalOffset": 14
          },
          {
            "type": "dot",
            "of": {
              "type": "root",
              "beginOffset": 15,
              "finalOffset": 17
            },
            "name": "Y",
            "beginOffset": 15,
            "finalOffset": 17
          }
        ],
        "beginOffset": 2,
        "finalOffset": 17
      }
    ])
  })

  it("parses a simple with block", () => {
    const result = Abstrate.go.parse(
      "{{with .X}}hello{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "with",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 7,
            "finalOffset": 9
          },
          "name": "X",
          "beginOffset": 7,
          "finalOffset": 9
        },
        "body": [
          {
            "type": "text",
            "content": "hello",
            "beginOffset": 11,
            "finalOffset": 16
          }
        ],
        "elseBody": [],
        "beginOffset": 2,
        "finalOffset": 21
      }
    ])
  })

  it("parses a with block with else block", () => {
    const result = Abstrate.go.parse(
      "{{with .X}}hello{{else}}goodbye{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "with",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 7,
            "finalOffset": 9
          },
          "name": "X",
          "beginOffset": 7,
          "finalOffset": 9
        },
        "body": [
          {
            "type": "text",
            "content": "hello",
            "beginOffset": 11,
            "finalOffset": 16
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "goodbye",
            "beginOffset": 24,
            "finalOffset": 31
          }
        ],
        "beginOffset": 2,
        "finalOffset": 36
      }
    ])
  })

  it("parses leading text with trimRight", () => {
    const result = Abstrate.go.parse(
      "x \r\n\t{{- 3}}"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "x \r\n\t",
        "beginOffset": 0,
        "finalOffset": 5,
        "trimRight": true
      },
      {
        "type": "number",
        "value": 3,
        "beginOffset": 9,
        "finalOffset": 10
      }
    ])
  })

  it("parses trailing text with trimLeft", () => {
    const result = Abstrate.go.parse(
      "{{3 -}}\n\n\ty"
    )
    assert.deepEqual(result, [
      {
        "type": "number",
        "value": 3,
        "beginOffset": 2,
        "finalOffset": 3
      },
      {
        "type": "text",
        "content": "\n\n\ty",
        "beginOffset": 7,
        "finalOffset": 11,
        "trimLeft": true
      }
    ])
  })

  it("parses leading and trailing text with trimRight and trimLeft", () => {
    const result = Abstrate.go.parse(
      "x \r\n\t{{- 3 -}}\n\n\ty"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "x \r\n\t",
        "beginOffset": 0,
        "finalOffset": 5,
        "trimRight": true
      },
      {
        "type": "number",
        "value": 3,
        "beginOffset": 9,
        "finalOffset": 10
      },
      {
        "type": "text",
        "content": "\n\n\ty",
        "beginOffset": 14,
        "finalOffset": 18,
        "trimLeft": true
      }
    ])
  })

  it("parses leading and trailing text with whitespace in the block", () => {
    const result = Abstrate.go.parse(
      "x\n{{-  3   -}}\ny"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "x\n",
        "beginOffset": 0,
        "finalOffset": 2,
        "trimRight": true
      },
      {
        "type": "number",
        "value": 3,
        "beginOffset": 7,
        "finalOffset": 8
      },
      {
        "type": "text",
        "content": "\ny",
        "beginOffset": 14,
        "finalOffset": 16,
        "trimLeft": true
      }
    ])
  })

  it("parses leading text with trimRight followed by a comment", () => {
    const result = Abstrate.go.parse(
      "x \r\n\t{{- /* hi */}}"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "x \r\n\t",
        "beginOffset": 0,
        "finalOffset": 5,
        "trimRight": true
      }
    ])
  })

  it("parses trailing text with trimLeft preceded by a comment", () => {
    const result = Abstrate.go.parse(
      "{{/* hi */ -}}\n\n\ty"
    )
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "\n\n\ty",
        "beginOffset": 14,
        "finalOffset": 18,
        "trimLeft": true
      }
    ])
  })

  it("parses a block block", () => {
    const result = Abstrate.go.parse(
      "{{block \"foo\" .}}hello{{end}}"
    )
    assert.deepEqual(result, [
      {
        "type": "block",
        "term": {
          "type": "invoke",
          "target": {
            "type": "string",
            "content": "foo",
            "beginOffset": 8,
            "finalOffset": 13
          },
          "args": [
            {
              "type": "root",
              "beginOffset": 14,
              "finalOffset": 15
            }
          ],
          "beginOffset": 8,
          "finalOffset": 15
        },
        "body": [
          {
            "type": "text",
            "content": "hello",
            "beginOffset": 17,
            "finalOffset": 22
          }
        ],
        "beginOffset": 2,
        "finalOffset": 27
      }
    ])
  })

  it("parses a variable invocation with a positive number literal arg", () => {
    const result = Abstrate.go.parse(
      "{{$x:=.}}{{$x +2}}"
    )
    assert.deepEqual(result, [
      {
        "type": "declare",
        "name": "x",
        "value": {
          "type": "root",
          "beginOffset": 6,
          "finalOffset": 7
        },
        "beginOffset": 2,
        "finalOffset": 7
      },
      {
        "type": "invoke",
        "target": {
          "type": "variable",
          "name": "x",
          "beginOffset": 11,
          "finalOffset": 13
        },
        "args": [
          {
            "type": "number",
            "value": 2,
            "beginOffset": 14,
            "finalOffset": 16
          }
        ],
        "beginOffset": 11,
        "finalOffset": 16
      }
    ])
  })

  ///
  // Test cases from https://github.com/golang/go/blob/94e9a5e19b831504eca2b7202b78d1a48c4be547/src/html/template/example_test.go

  it("parses a simple example with HTML text content", () => {
    const result = Abstrate.go.parse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>{{.Title}}</title>
      </head>
      <body>
        {{range .Items}}<div>{{ . }}</div>{{else}}<div><strong>no rows</strong></div>{{end}}
      </body>
    </html>
    `)
    assert.deepEqual(result, [
      {
        "type": "text",
        "content": "\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <meta charset=\"UTF-8\">\n        <title>",
        "beginOffset": 0,
        "finalOffset": 91
      },
      {
        "type": "dot",
        "of": {
          "type": "root",
          "beginOffset": 93,
          "finalOffset": 99
        },
        "name": "Title",
        "beginOffset": 93,
        "finalOffset": 99
      },
      {
        "type": "text",
        "content": "</title>\n      </head>\n      <body>\n        ",
        "beginOffset": 101,
        "finalOffset": 145
      },
      {
        "type": "range",
        "term": {
          "type": "dot",
          "of": {
            "type": "root",
            "beginOffset": 153,
            "finalOffset": 159
          },
          "name": "Items",
          "beginOffset": 153,
          "finalOffset": 159
        },
        "body": [
          {
            "type": "text",
            "content": "<div>",
            "beginOffset": 161,
            "finalOffset": 166
          },
          {
            "type": "root",
            "beginOffset": 169,
            "finalOffset": 171
          },
          {
            "type": "text",
            "content": "</div>",
            "beginOffset": 173,
            "finalOffset": 179
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "<div><strong>no rows</strong></div>",
            "beginOffset": 187,
            "finalOffset": 222
          }
        ],
        "beginOffset": 147,
        "finalOffset": 227
      },
      {
        "type": "text",
        "content": "\n      </body>\n    </html>\n    ",
        "beginOffset": 229,
        "finalOffset": 260
      }
    ])
  })

  it("parses the example from the README", () => {
    const result = Abstrate.go.parse(
      "{{ $Greeting }}, {{ exclaim .Object }}"
    )
    assert.deepEqual(result, [
      {
        type: "variable",
        name: "Greeting",
        beginOffset: 3,
        finalOffset: 12,
      },
      {
        type: "text",
        content: ", ",
        beginOffset: 15,
        finalOffset: 17,
      },
      {
        type: "invoke",
        target: {
          type: "builtin",
          name: "exclaim",
          beginOffset: 20,
          finalOffset: 27,
        },
        args: [
          {
            type: "dot",
            of: {
              type: "root",
              beginOffset: 28,
              finalOffset: 36,
            },
            name: "Object",
            beginOffset: 28,
            finalOffset: 36,
          }
        ],
        beginOffset: 20,
        finalOffset: 36,
      }
    ])
  })
})
