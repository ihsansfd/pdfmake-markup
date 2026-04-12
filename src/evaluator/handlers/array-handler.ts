import { ArrayNode, SpreadNode } from '../../parser';
import { EvalError } from '../errors';
import { Vars } from '../types';
import { evalNode } from '../eval-node';
import { IF_SKIP } from './if-handler';

export function evalArray(node: ArrayNode, vars: Vars): unknown[] {
  const result: unknown[] = [];
  for (const el of node.elements) {
    if (el.type === 'Spread') {
      const value = evalNode((el as SpreadNode).value, vars);
      if (value === IF_SKIP) continue;
      if (!Array.isArray(value)) {
        throw new EvalError(`spread operand must be an array, got ${typeof value}`);
      }
      result.push(...value);
      continue;
    }
    const value = evalNode(el, vars);
    if (value === IF_SKIP) continue;
    result.push(value);
  }
  return result;
}
