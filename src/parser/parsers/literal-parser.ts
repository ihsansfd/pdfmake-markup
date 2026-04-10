import { LiteralNode } from '../types';
import { TokenStream } from '../token-stream';

export function parseLiteral(stream: TokenStream): LiteralNode {
  const token = stream.advance();
  return { type: 'Literal', value: token.value };
}
