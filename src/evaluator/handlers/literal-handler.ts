import { LiteralNode } from '../../parser';

export function evalLiteral(node: LiteralNode): unknown {
  return node.value;
}
