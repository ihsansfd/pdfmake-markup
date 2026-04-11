import { ArrayNode } from '../../parser';
import { Vars } from '../types';
import { evalNode } from '../eval-node';
import { evalFor } from './for-handler';
import { evalIf, IF_SKIP } from './if-handler';

export function evalArray(node: ArrayNode, vars: Vars): unknown[] {
  const result: unknown[] = [];
  for (const el of node.elements) {
    if (el.type === 'For') {
      result.push(...evalFor(el, vars));
      continue;
    }
    if (el.type === 'If') {
      const val = evalIf(el, vars);
      if (val === IF_SKIP) continue;
      result.push(val);
      continue;
    }
    result.push(evalNode(el, vars));
  }
  return result;
}
