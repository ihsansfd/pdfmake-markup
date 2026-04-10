import { ASTNode } from '../parser';
import { Context } from './types';
import { evalNode } from './eval-node';

export { EvalError } from './errors';
export { Context } from './types';

export function evaluate(ast: ASTNode, context: Context = {}): unknown {
  return evalNode(ast, context);
}
