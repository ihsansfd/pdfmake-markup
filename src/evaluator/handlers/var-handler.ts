import { VarNode } from '../../parser';
import { EvalError } from '../errors';
import { Context } from '../types';

export function evalVar(node: VarNode, context: Context): unknown {
  if (!(node.name in context)) {
    throw new EvalError(`Undefined variable: ${node.name}`);
  }
  return context[node.name];
}
