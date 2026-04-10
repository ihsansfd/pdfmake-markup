import { ExprNode } from '../types';
import { TokenStream } from '../token-stream';

export function parseExpr(stream: TokenStream): ExprNode {
  const token = stream.advance();
  return { type: 'Expr', expression: token.value as string };
}
