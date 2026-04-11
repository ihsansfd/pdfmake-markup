import { IfNode } from '../../parser';
import { Vars } from '../types';
import { evalNode } from '../eval-node';

export const IF_SKIP = Symbol('if-skip');

export function evalIf(node: IfNode, vars: Vars): unknown {
  const cond = evalNode(node.cond, vars);
  if (cond) {
    return evalNode(node.then, vars);
  }
  if (node.else) {
    return evalNode(node.else, vars);
  }
  return IF_SKIP;
}
