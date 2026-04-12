export enum TokenType {
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COLON = 'COLON',
  COMMA = 'COMMA',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  IDENTIFIER = 'IDENTIFIER',
  GIVEN = 'GIVEN',
  MAP = 'MAP',
  IN = 'IN',
  IF = 'IF',
  ELSE = 'ELSE',
  SPREAD = 'SPREAD',
  EXPR = 'EXPR',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: unknown;
  line: number;
  col: number;
}
