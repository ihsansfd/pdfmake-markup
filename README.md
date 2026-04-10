# pdfmake-markup

A markup language that decodes into [pdfmake](https://github.com/bpampuch/pdfmake) document definition objects, with support for safe expressions, variables, and function callbacks — no `eval()`.

## Why?

pdfmake defines documents as JavaScript objects. These objects can contain functions (for dynamic layouts, headers, footers, etc.) and reference variables. This makes them impossible to serialize as JSON and send over the network.

**pdfmake-markup** solves this by providing a markup format (`.pdfmk`) that can be stored as a plain string, sent from backend to frontend, and decoded at runtime into a real JS object with live functions — safely, without `eval`.

## Install

```bash
npm install pdfmake-markup
```

## Usage

```js
const { decode } = require('pdfmake-markup');
const pdfMake = require('pdfmake');

// Markup can come from a file, database, API, etc.
const markup = `{
  content: [
    { text: %{var:title}%, bold: true, fontSize: 18 },
    %{var:body}%
  ]
}`;

// decode() returns a real JS object ready for pdfmake
const docDefinition = decode(markup, {
  title: 'Hello World',
  body: 'This was decoded from a markup string.',
});

pdfMake.createPdf(docDefinition).download();
```

## Syntax

The `.pdfmk` format is a superset of JSON-like object notation with three additions:

### Variables: `%{var:name}%`

Substituted at decode time from the context object.

```
{ text: %{var:username}% }
```

```js
decode(markup, { username: 'Alice' });
// => { text: 'Alice' }
```

### Expressions: `%{...}%`

Safe expressions evaluated at decode time using [jexl](https://github.com/TomFrost/Jexl). Supports arithmetic, ternary, comparisons, property access, and modulo.

```
{ fontSize: %{base * 2}%, color: %{score > 90 ? "green" : "red"}% }
```

```js
decode(markup, { base: 10, score: 95 });
// => { fontSize: 20, color: 'green' }
```

### Functions: `params(...) { }`

Becomes a real JavaScript function. Expressions inside the body are evaluated each time the function is called, with access to both function arguments and decode context.

```
{
  table: {
    heights: params(row) {
      %{(row + 1) * 25}%
    },
    body: [["A", "B"], ["C", "D"]]
  },
  layout: {
    hLineWidth: params(i, node) {
      %{(i == 0 || i == (node.table.body|length)) ? 2 : 1}%
    },
    fillColor: params(rowIndex, node, columnIndex) {
      %{rowIndex % 2 == 0 ? "#CCCCCC" : null}%
    }
  }
}
```

Function bodies can return:
- A single expression: `params(x) { %{x * 2}% }`
- An object: `params(page) { left: %{page % 2 == 0 ? 80 : 40}%, top: 40 }`
- An array: `params(x) { [%{x}%, %{x + 1}%] }`

### Comments

Both line and block comments are supported.

```
{
  // line comment
  a: 1,
  /* block comment */
  b: 2
}
```

### Other features

- Unquoted object keys: `{ fontSize: 18 }` (like JavaScript)
- Single and double quoted strings: `'hello'` or `"hello"`
- Trailing commas: `{ a: 1, b: 2, }`
- `null` and `undefined` literals
- Nested objects and arrays

## Expression notes

Expressions use [jexl](https://github.com/TomFrost/Jexl) syntax, which is similar to JavaScript with a few differences:

- Use `==` instead of `===` (strict equality is not supported)
- `.length` on arrays/strings is auto-converted to jexl's `|length` transform — both `arr.length` and `arr|length` work
- `null` is supported in expressions
- Property access works: `node.table.body`, `obj.nested.value`

## API

### `decode(markup: string, context?: Record<string, unknown>): unknown`

Parses a `.pdfmk` markup string and returns a JavaScript object.

- **markup** — the `.pdfmk` string
- **context** — variables available to `%{var:name}%` and `%{expr}%`

## License

MIT
