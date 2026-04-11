import { Token, TokenType } from '../types';
import { Scanner } from '../scanner';
import { readGiven } from './given-reader';

const KEYWORD_MAP: Record<string, () => { type: TokenType; value: unknown }> = {
  'true':      () => ({ type: TokenType.BOOLEAN, value: true }),
  'false':     () => ({ type: TokenType.BOOLEAN, value: false }),
  'null':      () => ({ type: TokenType.NULL, value: null }),
  'undefined': () => ({ type: TokenType.NULL, value: undefined }),
  'for':       () => ({ type: TokenType.FOR, value: 'for' }),
  'in':        () => ({ type: TokenType.IN, value: 'in' }),
  'if':        () => ({ type: TokenType.IF, value: 'if' }),
  'else':      () => ({ type: TokenType.ELSE, value: 'else' }),
};

export function readIdentifierOrKeyword(scanner: Scanner): Token {
  const startLine = scanner.currentLine;
  const startCol = scanner.currentCol;
  let name = '';

  while (!scanner.isAtEnd && /[a-zA-Z0-9_$]/.test(scanner.current()!)) {
    name += scanner.current();
    scanner.advance();
  }

  if (name === 'given') {
    return readGiven(scanner, startLine, startCol);
  }

  const keyword = KEYWORD_MAP[name];
  if (keyword) {
    const { type, value } = keyword();
    return { type, value, line: startLine, col: startCol };
  }

  return { type: TokenType.IDENTIFIER, value: name, line: startLine, col: startCol };
}
