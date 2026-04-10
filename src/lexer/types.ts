export enum TokenType {
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  COLON = 'COLON',
  COMMA = 'COMMA',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  IDENTIFIER = 'IDENTIFIER',
  GIVEN = 'GIVEN',
  EXPR = 'EXPR',
  VAR = 'VAR',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: unknown;
  line: number;
  col: number;
}
