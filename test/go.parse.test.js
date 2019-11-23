"use strict"
const assert = require("assert")
const Abstrate = require("../src")

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
        "content": " \t\n"
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
        "content": "some text"
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
          "type": "root"
        },
        "name": "X"
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
              "type": "root"
            },
            "name": "X"
          },
          "name": "Y"
        },
        "name": "Z"
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
        "name": "printf"
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
        "name": ""
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
            "value": 3
          }
        },
        "body": [
          {
            "type": "invoke",
            "target": {
              "type": "variable",
              "name": "x"
            },
            "args": [
              {
                "type": "number",
                "value": 23
              }
            ]
          }
        ],
        "elseBody": []
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
          "name": ""
        },
        "name": "I"
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
          "name": "printf"
        },
        "args": [
          {
            "type": "string",
            "content": "%d"
          },
          {
            "type": "number",
            "value": 23
          }
        ]
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
            "type": "root"
          },
          "name": "X"
        },
        "to": {
          "type": "dot",
          "of": {
            "type": "root"
          },
          "name": "Y"
        }
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
              "type": "root"
            },
            "name": "X"
          },
          "to": {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "Y"
          }
        }
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
            "type": "root"
          },
          "name": "X"
        },
        "args": [
          {
            "type": "invoke",
            "target": {
              "type": "dot",
              "of": {
                "type": "root"
              },
              "name": "Y"
            },
            "args": [
              {
                "type": "dot",
                "of": {
                  "type": "root"
                },
                "name": "Z"
              }
            ]
          },
          {
            "type": "pipe",
            "from": {
              "type": "dot",
              "of": {
                "type": "root"
              },
              "name": "A"
            },
            "to": {
              "type": "invoke",
              "target": {
                "type": "dot",
                "of": {
                  "type": "root"
                },
                "name": "B"
              },
              "args": [
                {
                  "type": "dot",
                  "of": {
                    "type": "root"
                  },
                  "name": "C"
                }
              ]
            }
          },
          {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "E"
          }
        ]
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
              "type": "root"
            },
            "name": "Y"
          },
          "args": [
            {
              "type": "dot",
              "of": {
                "type": "root"
              },
              "name": "Z"
            }
          ]
        },
        "name": "Field"
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "hello"
          }
        ],
        "elseBody": []
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "true"
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "false"
          }
        ]
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "true"
          }
        ],
        "elseBody": {
          "type": "if",
          "term": {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "Y"
          },
          "body": [
            {
              "type": "text",
              "content": "false"
            }
          ],
          "elseBody": []
        }
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
        "content": "+"
      },
      {
        "type": "if",
        "term": {
          "type": "dot",
          "of": {
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "X"
          }
        ],
        "elseBody": {
          "type": "if",
          "term": {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "Y"
          },
          "body": [
            {
              "type": "text",
              "content": "Y"
            }
          ],
          "elseBody": {
            "type": "if",
            "term": {
              "type": "dot",
              "of": {
                "type": "root"
              },
              "name": "Z"
            },
            "body": [
              {
                "type": "text",
                "content": "Z"
              }
            ],
            "elseBody": []
          }
        }
      },
      {
        "type": "text",
        "content": "+"
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "hello"
          }
        ],
        "elseBody": []
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
                "type": "root"
              },
              "name": "X"
            },
            "name": "Y"
          },
          "name": "Z"
        },
        "body": [
          {
            "type": "text",
            "content": "hello"
          }
        ],
        "elseBody": []
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "hello"
          },
          {
            "type": "range",
            "term": {
              "type": "dot",
              "of": {
                "type": "root"
              },
              "name": "Y"
            },
            "body": [
              {
                "type": "text",
                "content": "goodbye"
              }
            ],
            "elseBody": []
          }
        ],
        "elseBody": []
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "true"
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "false"
          }
        ]
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
              "type": "root"
            },
            "name": "X"
          },
          "to": {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "M"
          }
        },
        "body": [
          {
            "type": "text",
            "content": "true"
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "false"
          }
        ]
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
            "type": "root"
          },
          "name": "SI"
        },
        "body": [
          {
            "type": "root"
          }
        ],
        "elseBody": []
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
        "term": {
          "type": "declare",
          "name": "x",
          "value": {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "SI"
          }
        },
        "body": [
          {
            "type": "root"
          }
        ],
        "elseBody": []
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
          "name": "x"
        },
        "term": {
          "type": "declare",
          "name": "y",
          "value": {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "SI"
          }
        },
        "body": [
          {
            "type": "root"
          }
        ],
        "elseBody": []
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
              "type": "root"
            },
            "name": "SI"
          },
          "args": [
            {
              "type": "number",
              "value": 1
            },
            {
              "type": "number",
              "value": -3.2
            },
            {
              "type": "builtin",
              "name": "true"
            },
            {
              "type": "builtin",
              "name": "false"
            },
            {
              "type": "char",
              "content": "a"
            },
            {
              "type": "builtin",
              "name": "nil"
            }
          ]
        },
        "body": [],
        "elseBody": []
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
          "name": "template"
        },
        "args": [
          {
            "type": "string",
            "content": "x"
          }
        ]
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
          "name": "template"
        },
        "args": [
          {
            "type": "string",
            "content": "x"
          },
          {
            "type": "dot",
            "of": {
              "type": "root"
            },
            "name": "Y"
          }
        ]
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "hello"
          }
        ],
        "elseBody": []
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
            "type": "root"
          },
          "name": "X"
        },
        "body": [
          {
            "type": "text",
            "content": "hello"
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "goodbye"
          }
        ]
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
        "trimRight": true
      },
      {
        "type": "number",
        "value": 3
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
        "value": 3
      },
      {
        "type": "text",
        "content": "\n\n\ty",
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
        "trimRight": true
      },
      {
        "type": "number",
        "value": 3
      },
      {
        "type": "text",
        "content": "\n\n\ty",
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
        "trimRight": true
      },
      {
        "type": "number",
        "value": 3
      },
      {
        "type": "text",
        "content": "\ny",
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
            "content": "foo"
          },
          "args": [
            {
              "type": "root"
            }
          ]
        },
        "body": [
          {
            "type": "text",
            "content": "hello"
          }
        ]
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
          "type": "root"
        }
      },
      {
        "type": "invoke",
        "target": {
          "type": "variable",
          "name": "x"
        },
        "args": [
          {
            "type": "number",
            "value": 2
          }
        ]
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
        "content": "\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <meta charset=\"UTF-8\">\n        <title>"
      },
      {
        "type": "dot",
        "of": {
          "type": "root"
        },
        "name": "Title"
      },
      {
        "type": "text",
        "content": "</title>\n      </head>\n      <body>\n        "
      },
      {
        "type": "range",
        "term": {
          "type": "dot",
          "of": {
            "type": "root"
          },
          "name": "Items"
        },
        "body": [
          {
            "type": "text",
            "content": "<div>"
          },
          {
            "type": "root"
          },
          {
            "type": "text",
            "content": "</div>"
          }
        ],
        "elseBody": [
          {
            "type": "text",
            "content": "<div><strong>no rows</strong></div>"
          }
        ]
      },
      {
        "type": "text",
        "content": "\n      </body>\n    </html>\n    "
      }
    ])
  })
})
