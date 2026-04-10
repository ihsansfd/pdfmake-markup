import { ExprNode } from '../../parser';
import { Vars } from '../types';
import { evalExpression } from '../expr';

export function evalExpr(node: ExprNode, vars: Vars): unknown {
  return evalExpression(node.expression, vars);
}
