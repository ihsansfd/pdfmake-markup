import { ASTNode } from '../parser';
import { evalNode } from './eval-node';

export { EvalError } from './errors';

export function evaluate(ast: ASTNode): unknown {
  return evalNode(ast, {});
}
