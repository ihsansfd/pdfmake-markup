import { LiteralNode } from '../types';
import { TokenStream } from '../token-stream';

export function parseLiteral(stream: TokenStream): LiteralNode {
  const tok = stream.advance();
  return { type: 'Literal', value: tok.value };
}
