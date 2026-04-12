import { TokenType } from '../../lexer';
import { ArrayNode, ASTNode, SpreadNode } from '../types';
import { TokenStream } from '../token-stream';
import { parseValue } from './value-parser';

export function parseArray(stream: TokenStream): ArrayNode {
  stream.expectThenAdvance(TokenType.LBRACKET);
  const elements: ASTNode[] = [];

  while (stream.current().type !== TokenType.RBRACKET) {
    if (stream.current().type === TokenType.SPREAD) {
      stream.advance();
      const value = parseValue(stream);
      const spread: SpreadNode = { type: 'Spread', value };
      elements.push(spread);
    } else {
      elements.push(parseValue(stream));
    }
    stream.skipIf(TokenType.COMMA);
  }

  stream.expectThenAdvance(TokenType.RBRACKET);
  return { type: 'Array', elements };
}
