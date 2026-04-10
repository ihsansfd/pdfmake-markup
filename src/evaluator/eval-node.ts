import { ASTNode } from '../parser';
import { EvalError } from './errors';
import { Context } from './types';
import {
  evalLiteral,
  evalVar,
  evalExpr,
  evalObject,
  evalArray,
  evalFunction,
} from './handlers';

type NodeHandler = (node: ASTNode, context: Context) => unknown;

const NODE_HANDLERS: Record<string, NodeHandler> = {
  Literal:  (node, _ctx) => evalLiteral(node as any),
  Var:      (node, ctx) => evalVar(node as any, ctx),
  Expr:     (node, ctx) => evalExpr(node as any, ctx),
  Object:   (node, ctx) => evalObject(node as any, ctx),
  Array:    (node, ctx) => evalArray(node as any, ctx),
  Function: (node, ctx) => evalFunction(node as any, ctx),
};

export function evalNode(node: ASTNode, context: Context): unknown {
  const handler = NODE_HANDLERS[node.type];
  if (!handler) {
    throw new EvalError(`Unknown AST node type: ${node.type}`);
  }
  return handler(node, context);
}
