import { MapNode } from '../../parser';
import { EvalError } from '../errors';
import { Vars } from '../types';
import { evalNode } from '../eval-node';
import { IF_SKIP } from './if-handler';

export function evalMap(node: MapNode, vars: Vars): unknown[] {
  const iterable = evalNode(node.iterable, vars);
  if (!Array.isArray(iterable)) {
    throw new EvalError(`map iterable must be an array, got ${typeof iterable}`);
  }

  const results: unknown[] = [];
  const length = iterable.length;
  const parentLoops = (vars.$loops as Record<string, unknown>) || {};
  for (let i = 0; i < length; i++) {
    const scope: Vars = {
      ...vars,
      [node.varName]: iterable[i],
      $loops: { ...parentLoops, [node.varName]: { index: i, length } },
    };
    const value = evalNode(node.body, scope);
    if (value === IF_SKIP) continue;
    results.push(value);
  }
  return results;
}
