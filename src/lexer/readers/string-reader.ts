import { Token, TokenType } from '../types';
import { LexerError } from '../errors';
import { Scanner } from '../scanner';

const ESCAPE_MAP: Record<string, string> = {
  'n': '\n',
  't': '\t',
  'r': '\r',
  '\\': '\\',
  "'": "'",
  '"': '"',
};

export function readString(scanner: Scanner, quote: string): Token {
  const startLine = scanner.currentLine;
  const startCol = scanner.currentCol;
  scanner.advance(); // skip opening quote

  let value = '';
  while (!scanner.isAtEnd && scanner.current() !== quote) {
    if (scanner.current() === '\\') {
      scanner.advance();
      const esc = scanner.current();
      if (esc === undefined) {
        throw new LexerError('Unterminated string', startLine, startCol);
      }
      value += ESCAPE_MAP[esc] ?? esc;
      scanner.advance();
    } else {
      value += scanner.current();
      scanner.advance();
    }
  }

  if (scanner.isAtEnd) {
    throw new LexerError('Unterminated string', startLine, startCol);
  }
  scanner.advance(); // skip closing quote

  return { type: TokenType.STRING, value, line: startLine, col: startCol };
}
