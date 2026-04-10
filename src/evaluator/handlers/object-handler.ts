import { ObjectNode } from '../../parser';
import { Vars } from '../types';
import { evalNode } from '../eval-node';

export function evalObject(node: ObjectNode, vars: Vars): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const prop of node.properties) {
    result[prop.key] = evalNode(prop.value, vars);
  }
  return result;
}
