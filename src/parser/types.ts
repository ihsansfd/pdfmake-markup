export type ASTNode =
  | LiteralNode
  | ExprNode
  | ObjectNode
  | ArrayNode
  | FunctionNode
  | MapNode
  | IfNode
  | SpreadNode;

export interface LiteralNode {
  type: 'Literal';
  value: unknown;
}

export interface ExprNode {
  type: 'Expr';
  expression: string;
}

export interface ObjectProperty {
  key: string;
  value: ASTNode;
}

export interface ObjectNode {
  type: 'Object';
  properties: ObjectProperty[];
}

export interface ArrayNode {
  type: 'Array';
  elements: ASTNode[];
}

export interface FunctionNode {
  type: 'Function';
  given: string[];
  body: ASTNode;
}

export interface MapNode {
  type: 'Map';
  varName: string;
  iterable: ASTNode;
  body: ASTNode;
}

export interface IfNode {
  type: 'If';
  cond: ASTNode;
  then: ASTNode;
  else?: ASTNode;
}

export interface SpreadNode {
  type: 'Spread';
  value: ASTNode;
}
