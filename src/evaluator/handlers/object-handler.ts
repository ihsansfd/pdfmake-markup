import { ObjectNode } from '../../parser';
import { Context } from '../types';
import { evalNode } from '../eval-node';

export function evalObject(node: ObjectNode, context: Context): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const prop of node.properties) {
    result[prop.key] = evalNode(prop.value, context);
  }
  return result;
}
