import { ExprNode } from '../../parser';
import { Context } from '../types';
import { evalExpression } from '../expr';

export function evalExpr(node: ExprNode, context: Context): unknown {
  return evalExpression(node.expression, context);
}
