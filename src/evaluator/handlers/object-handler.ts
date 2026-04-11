import { ObjectNode } from '../../parser';
import { Vars } from '../types';
import { evalNode } from '../eval-node';
import { IF_SKIP } from './if-handler';

export function evalObject(node: ObjectNode, vars: Vars): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const prop of node.properties) {
    const value = evalNode(prop.value, vars);
    if (value === IF_SKIP) continue;
    result[prop.key] = value;
  }
  return result;
}
