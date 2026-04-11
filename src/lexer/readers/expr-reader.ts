import { Token, TokenType } from '../types';
import { LexerError } from '../errors';
import { Scanner } from '../scanner';

export function readExpr(scanner: Scanner): Token {
  const startLine = scanner.currentLine;
  const startCol = scanner.currentCol;
  scanner.advance(); // skip %
  scanner.advance(); // skip {

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
