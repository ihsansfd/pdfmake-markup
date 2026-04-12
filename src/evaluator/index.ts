import { ASTNode } from '../parser';
import { evalNode } from './eval-node';
import { IF_SKIP } from './handlers';

export { EvalError } from './errors';

export function evaluate(ast: ASTNode): unknown {
  const result = evalNode(ast, {});
  return result === IF_SKIP ? undefined : result;
}
