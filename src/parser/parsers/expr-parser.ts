import { ExprNode } from '../types';
import { TokenStream } from '../token-stream';

export function parseExpr(stream: TokenStream): ExprNode {
  const tok = stream.advance();
  return { type: 'Expr', expression: tok.value as string };
}
