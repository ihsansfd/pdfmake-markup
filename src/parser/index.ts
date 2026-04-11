import { Token, TokenType } from '../lexer';
import { ASTNode } from './types';
import { ParseError } from './errors';
import { TokenStream } from './token-stream';
import { parseValue } from './parsers';

export { ASTNode, LiteralNode, ExprNode, ObjectNode, ArrayNode, FunctionNode, ForNode, IfNode } from './types';
export { ParseError } from './errors';

export function parse(tokens: Token[]): ASTNode {
  const stream = new TokenStream(tokens);
  const ast = parseValue(stream);

  if (stream.current().type !== TokenType.EOF) {
    throw new ParseError(
      `Unexpected token after end of value: ${stream.current().type}`,
      stream.current(),
    );
  }

  return ast;
}
