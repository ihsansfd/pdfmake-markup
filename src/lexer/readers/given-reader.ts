import { Token, TokenType } from '../types';
import { LexerError } from '../errors';
import { Scanner } from '../scanner';

export function readGiven(scanner: Scanner, startLine: number, startCol: number): Token {
  scanner.skipWhitespaceAndComments();

  if (scanner.current() !== '(') {
    throw new LexerError("Expected '(' after 'given'", scanner.currentLine, scanner.currentCol);
  }
  scanner.advance(); // skip (

  let givenStr = '';
  while (!scanner.isAtEnd && scanner.current() !== ')') {
    givenStr += scanner.current();
    scanner.advance();
  }

  if (scanner.isAtEnd) {
    throw new LexerError('Unterminated given declaration', startLine, startCol);
  }
  scanner.advance(); // skip )

  const names = givenStr.split(',').map((part) => part.trim()).filter((part) => part.length > 0);
  return { type: TokenType.GIVEN, value: names, line: startLine, col: startCol };
}
