import { VarNode } from '../types';
import { TokenStream } from '../token-stream';

export function parseVar(stream: TokenStream): VarNode {
  const tok = stream.advance();
  return { type: 'Var', name: tok.value as string };
}
