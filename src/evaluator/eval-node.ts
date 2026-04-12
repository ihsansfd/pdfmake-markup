import { ASTNode } from '../parser';
import { EvalError } from './errors';
import { Vars } from './types';
import {
  evalLiteral,
  evalExpr,
  evalObject,
  evalArray,
  evalFunction,
  evalMap,
  evalIf,
} from './handlers';

type NodeHandler = (node: ASTNode, vars: Vars) => unknown;

const NODE_HANDLERS: Record<string, NodeHandler> = {
  Literal:  (node, _vars) => evalLiteral(node as any),
  Expr:     (node, vars) => evalExpr(node as any, vars),
  Object:   (node, vars) => evalObject(node as any, vars),
  Array:    (node, vars) => evalArray(node as any, vars),
  Function: (node, vars) => evalFunction(node as any, vars),
  Map:      (node, vars) => evalMap(node as any, vars),
  If:       (node, vars) => evalIf(node as any, vars),
};

export function evalNode(node: ASTNode, vars: Vars): unknown {
  const handler = NODE_HANDLERS[node.type];
  if (!handler) {
    throw new EvalError(`Unknown AST node type: ${node.type}`);
  }
  return handler(node, vars);
}
