# pdfmake-markup

A markup language that decodes into [pdfmake](https://github.com/bpampuch/pdfmake) document definition objects, with support for safe expressions, dynamic lists, and function callbacks — no `eval()`.

## Why?

pdfmake defines documents as JavaScript objects. These objects can contain functions (for dynamic layouts, headers, footers, etc.) and runtime-only logic. This makes them impossible to serialize as JSON and send over the network.

**pdfmake-markup** solves this by providing a markup format (`.pdfmk`) that can be stored as a plain string, sent from backend to frontend, and decoded at runtime into a real JS object with live functions — safely, without `eval`.

## Install

```bash
npm install pdfmake-markup
```

## Usage

```js
const { decode } = require('pdfmake-markup');
const pdfMake = require('pdfmake');

const markup = `{
  content: [
    { text: 'Hello World', bold: true, fontSize: 18 },
    'This was decoded from a markup string.'
  ]
}`;

const docDefinition = decode(markup);
pdfMake.createPdf(docDefinition).download();
```

Need per-request substitution (e.g. injecting a user's name)? Render the markup with [Nunjucks](https://mozilla.github.io/nunjucks/) or any string templating tool on the backend **before** calling `decode`. pdfmake-markup intentionally does not ship its own variable system.

## Syntax

`.pdfmk` is a superset of JSON-like object notation. Keys can be unquoted, trailing commas are allowed, `null`/`undefined` are supported, and both `//` line and `/* ... */` block comments work.

On top of that, it adds four constructs:

### Expressions: `%{...}%`

Safe expressions evaluated at decode time. Supports arithmetic, ternary, comparisons, property access, modulo, and string concatenation.

```
{ fontSize: %{(10 + 2) * 2}%, color: %{95 > 90 ? "green" : "red"}% }
```

Inside `given()` bodies, expressions also have access to the function's arguments:

```
given(row) { %{(row + 1) * 25}% }
```

### Functions: `given(args) { body }`

Compiles to a real JavaScript function. The body is re-evaluated every time the function is called.

```
{
  layout: {
    hLineWidth: given(i, node) {
      %{(i == 0 || i == node.table.body.length) ? 2 : 1}%
    },
    fillColor: given(rowIndex, node, columnIndex) {
      %{rowIndex % 2 == 0 ? "#CCCCCC" : null}%
    }
  }
}
```

The body must be an explicit value. If you want to return an object literal, wrap it in braces:

```
margins: given(currentPage) {
  {
    left: %{currentPage == 1 ? 80 : 40}%,
    top: 40,
    right: 40,
    bottom: 40
  }
}
```

### Loops: `map(x in iterable) { body }`

Always returns an array, one entry per iteration. The iterable must itself be an array.

```
rows: map(row in %{["a", "b", "c"]}%) {
  { text: %{row}%, bold: true }
}
```

Inside the body you can reference `x::index` and `x::length` for first/last detection:

```
map(row in %{["a", "b", "c"]}%) {
  {
    text: %{row}%,
    isFirst: %{row::index == 0}%,
    isLast:  %{row::index == row::length - 1}%
  }
}
```

### Conditionals: `if(cond) { then } else { else }`

Returns the chosen branch's value. `else if` chains and the plain `else` clause are both optional. When an `if` with no `else` is not taken, the result is dropped from the surrounding array or object.

```
{
  content: [
    { text: 'Header' },
    if(%{showBody}%) { { text: 'Body' } },      // dropped when false
    if(%{tier == "gold"}%) { { text: 'Gold' } }
    else if(%{tier == "silver"}%) { { text: 'Silver' } }
    else { { text: 'Free' } }
  ]
}
```

### Spread: `...value`

Splices an array into its parent array. Use it when `map` (or an `if` branch that returns an array) should contribute many elements rather than a single nested array.

```
content: [
  { text: 'Intro' },
  ...map(p in %{["one", "two", "three"]}%) {
    { text: %{p}%, margin: [0, 4, 0, 0] }
  },
  { text: 'Outro' }
]
```

Without the `...`, `map(...) { ... }` would appear as a single nested array element. The spread is required and explicit — there is no implicit array-flattening anywhere in the language.

## Expression notes

Expressions support a JavaScript-like subset:

- Arithmetic: `+ - * / %`
- Comparisons: `==` (use `==`, not `===`), `!=`, `<`, `<=`, `>`, `>=`
- Logical: `&&`, `||`, `!`
- Ternary: `cond ? a : b`
- Property access: `node.table.body`, `obj.nested.value`
- `.length` on arrays/strings
- String concatenation with `+`
- `null` literal

## API

### `decode(markup: string): unknown`

Parses a `.pdfmk` markup string and returns the decoded JavaScript value (typically the pdfmake document definition).

## License

MIT
