import { TokenType } from '../../lexer';
import { ArrayNode } from '../types';
import { TokenStream } from '../token-stream';
import { parseValue } from './value-parser';

export function parseArray(stream: TokenStream): ArrayNode {
  stream.expectThenAdvance(TokenType.LBRACKET);
  const elements = [];

  while (stream.current().type !== TokenType.RBRACKET) {
    elements.push(parseValue(stream));
    stream.skipIf(TokenType.COMMA);
  }

  stream.expectThenAdvance(TokenType.RBRACKET);
  return { type: 'Array', elements };
}
