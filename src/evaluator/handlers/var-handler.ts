import { VarNode } from '../../parser';
import { EvalError } from '../errors';
import { Vars } from '../types';

export function evalVar(node: VarNode, vars: Vars): unknown {
  if (!(node.name in vars)) {
    throw new EvalError(`Undefined variable: ${node.name}`);
  }
  return vars[node.name];
}
