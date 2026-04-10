import { VarNode } from '../types';
import { TokenStream } from '../token-stream';

export function parseVar(stream: TokenStream): VarNode {
  const token = stream.advance();
  return { type: 'Var', name: token.value as string };
}
