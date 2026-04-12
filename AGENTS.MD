# AGENTS.md

Guidance for AI agents working in this repo.

## Project

`pdfmake-markup` — markup language (`.pdfmk`) that decodes into [pdfmake](https://github.com/bpampuch/pdfmake) document definitions. Solves the "pdfmake docDefs contain functions so can't be JSON-serialized" problem: backend sends plain markup string, frontend decodes to live JS object with real functions — no `eval`.

## Design philosophy

**Minimal.** The library's unique value is `given()` functions with runtime expressions that cannot be pre-computed. Everything else is either a direct enabler of that, or exists because pdfmake docDefs need dynamic arrays/objects that plain JSON can't express.

- **No variable substitution** (`%{var:name}%` does not exist). Use Nunjucks or similar on the backend to render the markup before sending it.
- **Expressions (`%{...}%`)** work anywhere — users write markup-native syntax inside; jexl is an implementation detail and must not be exposed in user-facing docs or error messages.
- **`given(args) { body }`** compiles to a real JS function. Body must be an explicit value (object literal requires `{ { ... } }`, no implicit-object sugar).
- **`map(x in iterable) { body }`** always returns an array. To splice its result into a parent array, use the spread operator `...map(...)`. Same for `...if(...)` when the branch returns an array.
- **`if(cond) { then } else { else }`** returns the chosen branch's value, or a sentinel `IF_SKIP` when there's no else and the condition is false. `IF_SKIP` is filtered out in array/object contexts (drops the element/property) and unwrapped to `undefined` at `evaluate()` top-level and `given` return.

If asked to add templating features (vars, static includes, string interpolation), push back: that belongs in Nunjucks on the backend.

## Architecture

Pipeline: `tokenize → parse → evaluate`

```
src/
  lexer/          char stream → tokens
    readers/      per-token-type readers (expr-reader, string-reader, etc.)
  parser/         tokens → AST
    parsers/      per-node-type parsers; dispatched via map in value-parser.ts
    token-stream.ts
  evaluator/      AST → JS object/functions
    handlers/     per-node-type handlers; dispatched via map in eval-node.ts
  index.ts        decode(markup: string): unknown
```

- **Token types**: LBRACE RBRACE LBRACKET RBRACKET LPAREN RPAREN COLON COMMA STRING NUMBER BOOLEAN NULL IDENTIFIER GIVEN MAP IN IF ELSE SPREAD EXPR EOF.
- **AST nodes**: Literal, Expr, Object, Array, Function, Map, If, Spread.
- **Expression engine**: [jexl](https://github.com/TomFrost/Jexl) under the hood — hidden from users. Users write plain markup values inside `%{...}%`; internally we transform (`.length` → `|length`, etc.) and wrap object literals via `markupLiteral`. Never surface the word "jexl" in docs or errors.
- **`given(args) { body }`** compiles to a real JS function. Body is parsed by `parseBlockBody = parseValue` (no implicit-object sugar). On return, `IF_SKIP` is unwrapped to `undefined` so the function always returns a usable value.
- **`map` / `if` / `...`**: `map` always returns an array, filtering `IF_SKIP` per iteration. `if` returns the chosen branch's value or `IF_SKIP`. The array handler recognizes `SpreadNode` to splice array operands in, and filters `IF_SKIP` for non-spread elements and spread operands. The object handler drops properties whose value is `IF_SKIP`.
- **Dispatch pattern**: both `parser/parsers/value-parser.ts` and `evaluator/eval-node.ts` use a `Record<TokenType | NodeType, handler>` map. Add new node types by adding an entry.

## Build & test

- TypeScript → CommonJS in `dist/`. Run `npx tsc` to build.
- Tests: [vitest](https://vitest.dev). Run `npx vitest run`.
- Samples: `node sample-runner.js <name>` — reads `samples/<name>.pdfmk`, writes `samples/pdfs/<name>.pdf`. Samples are self-contained; all data is inlined as markup literals.
- VSCode extension (`vscode/extension.js`) provides `.pdfmk` diagnostics by re-running `tokenize` + `parse` on edit. When adding token/AST types, update `tokenLength()` there too.

## Samples

`samples/` contains real pdfmake examples ported to `.pdfmk`:
- `sample-query-with-given.pdfmk` — canonical demo
- `basics.pdfmk`, `tables.pdfmk`, `styling_properties.pdfmk`, `snaking_columns.pdfmk`, `attachments.pdfmk`

All values are inlined (no external vars). `attachments.pdfmk` currently fails to render due to a pre-existing pdfkit bug (`Cannot read properties of undefined (reading 'getTime')` in `PDFDocument.file`) when handling data-URL attachments — unrelated to the decoder; decode itself succeeds.

## Conventions

- Keep the library surface small. `decode(markup)` is the only public entry point for users; `tokenize`, `parse`, `evaluate` are re-exported for advanced use (e.g., the VSCode extension).
- No comments explaining what code does — prefer clear names. Comments only for non-obvious *why*.
- Don't add features speculatively. Three similar lines beats a premature abstraction.
- Error types: `LexerError`, `ParseError`, `EvalError`. All carry enough location info for the VSCode extension to surface diagnostics.

## When modifying the language

1. Lexer: add reader in `src/lexer/readers/`, register in `src/lexer/index.ts`, add token type to `src/lexer/types.ts`.
2. Parser: add parser in `src/parser/parsers/`, register in `value-parser.ts` map, add AST type to `src/parser/types.ts`.
3. Evaluator: add handler in `src/evaluator/handlers/`, register in `eval-node.ts` map.
4. Tests: `src/lexer/index.test.ts`, `src/parser/index.test.ts`, `src/evaluator/index.test.ts`.
5. VSCode: update `vscode/extension.js` `tokenLength()` if the new token has nontrivial source length.
6. Docs: `README.md` user-facing syntax, this file if architecture shifts.
