import { Token, TokenType } from '../types';
import { Scanner } from '../scanner';

export function readNumber(scanner: Scanner): Token {
  const startLine = scanner.currentLine;
  const startCol = scanner.currentCol;
  let numStr = '';

  if (scanner.current() === '-') {
    numStr += '-';
    scanner.advance();
  }

  while (!scanner.isAtEnd && /[0-9]/.test(scanner.current()!)) {
    numStr += scanner.current();
    scanner.advance();
  }

  if (!scanner.isAtEnd && scanner.current() === '.') {
    numStr += '.';
    scanner.advance();
    while (!scanner.isAtEnd && /[0-9]/.test(scanner.current()!)) {
      numStr += scanner.current();
      scanner.advance();
    }
  }

  return { type: TokenType.NUMBER, value: Number(numStr), line: startLine, col: startCol };
}
