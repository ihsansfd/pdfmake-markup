import { Token, TokenType } from '../types';
import { LexerError } from '../errors';
import { Scanner } from '../scanner';

export function readExprOrVar(scanner: Scanner): Token {
  const startLine = scanner.currentLine;
  const startCol = scanner.currentCol;
  scanner.advance(); // skip %
  scanner.advance(); // skip {

  // Check if it's a var reference: %{var:name}%
  const varMatch = scanner.remaining().match(/^var:([a-zA-Z_$][a-zA-Z0-9_$]*)\}%/);
  if (varMatch) {
    scanner.advance(varMatch[0].length);
    return { type: TokenType.VAR, value: varMatch[1], line: startLine, col: startCol };
  }

  // Otherwise it's an expression: %{...}%
  let expr = '';
  let depth = 0;
  while (!scanner.isAtEnd) {
    if (scanner.current() === '{') {
      depth++;
      expr += scanner.current();
      scanner.advance();
    } else if (scanner.current() === '}') {
      if (depth === 0 && scanner.peek() === '%') {
        scanner.advance(2); // skip }%
        return { type: TokenType.EXPR, value: expr.trim(), line: startLine, col: startCol };
      }
      depth--;
      expr += scanner.current();
      scanner.advance();
    } else {
      expr += scanner.current();
      scanner.advance();
    }
  }

  throw new LexerError('Unterminated expression %{...}%', startLine, startCol);
}
