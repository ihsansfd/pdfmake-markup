import { ArrayNode } from '../../parser';
import { Vars } from '../types';
import { evalNode } from '../eval-node';

export function evalArray(node: ArrayNode, vars: Vars): unknown[] {
  return node.elements.map(el => evalNode(el, vars));
}
