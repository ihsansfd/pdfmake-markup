import { ArrayNode } from '../../parser';
import { Context } from '../types';
import { evalNode } from '../eval-node';

export function evalArray(node: ArrayNode, context: Context): unknown[] {
  return node.elements.map(el => evalNode(el, context));
}
