import { TokenType } from '../../lexer';
import { MapNode } from '../types';
import { TokenStream } from '../token-stream';
import { ParseError } from '../errors';
import { parseValue } from './value-parser';
import { parseBlockBody } from './function-parser';

export function parseMap(stream: TokenStream): MapNode {
  stream.expectThenAdvance(TokenType.MAP);
  stream.expectThenAdvance(TokenType.LPAREN);

  const varToken = stream.current();
  if (varToken.type !== TokenType.IDENTIFIER) {
    throw new ParseError(`Expected loop variable name, got ${varToken.type}`, varToken);
  }
  stream.advance();
  const varName = varToken.value as string;

  stream.expectThenAdvance(TokenType.IN);
  const iterable = parseValue(stream);
  stream.expectThenAdvance(TokenType.RPAREN);

  stream.expectThenAdvance(TokenType.LBRACE);
  const body = parseBlockBody(stream);
  stream.expectThenAdvance(TokenType.RBRACE);

  return { type: 'Map', varName, iterable, body };
}
