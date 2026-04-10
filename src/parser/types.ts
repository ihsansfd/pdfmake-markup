export type ASTNode =
  | LiteralNode
  | ExprNode
  | VarNode
  | ObjectNode
  | ArrayNode
  | FunctionNode;

export interface LiteralNode {
  type: 'Literal';
  value: unknown;
}

export interface ExprNode {
  type: 'Expr';
  expression: string;
}

export interface VarNode {
  type: 'Var';
  name: string;
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
