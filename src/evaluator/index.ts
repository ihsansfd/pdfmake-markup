import { ASTNode } from '../parser';
import { Vars } from './types';
import { evalNode } from './eval-node';

export { EvalError } from './errors';
export { Vars } from './types';

export function evaluate(ast: ASTNode, vars: Vars = {}): unknown {
  return evalNode(ast, vars);
}
