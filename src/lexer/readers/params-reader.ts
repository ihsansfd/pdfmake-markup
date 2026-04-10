import { Token, TokenType } from '../types';
import { LexerError } from '../errors';
import { Scanner } from '../scanner';

export function readParams(scanner: Scanner, startLine: number, startCol: number): Token {
  scanner.skipWhitespaceAndComments();

  if (scanner.current() !== '(') {
    throw new LexerError("Expected '(' after 'params'", scanner.currentLine, scanner.currentCol);
  }
  scanner.advance(); // skip (

  let paramsStr = '';
  while (!scanner.isAtEnd && scanner.current() !== ')') {
    paramsStr += scanner.current();
    scanner.advance();
  }

  if (scanner.isAtEnd) {
    throw new LexerError('Unterminated params declaration', startLine, startCol);
  }
  scanner.advance(); // skip )

  const paramNames = paramsStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
  return { type: TokenType.PARAMS, value: paramNames, line: startLine, col: startCol };
}
