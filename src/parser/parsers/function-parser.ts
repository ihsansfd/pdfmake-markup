import { TokenType } from '../../lexer';
import { ASTNode, FunctionNode } from '../types';
import { TokenStream } from '../token-stream';
import { parseObjectProperties } from './object-parser';
import { parseValue } from './value-parser';

export function parseBlockBody(stream: TokenStream): ASTNode {
  const token = stream.current();
  const next = stream.peek();

  // If current is identifier/string followed by colon → implicit object body (braces already consumed)
  const isObjectBody =
    (token.type === TokenType.IDENTIFIER || token.type === TokenType.STRING) &&
    next?.type === TokenType.COLON;

  if (isObjectBody) {
    const properties = parseObjectProperties(stream);
    return { type: 'Object', properties };
  }

  return parseValue(stream);
}

export function parseFunction(stream: TokenStream): FunctionNode {
  const givenToken = stream.advance(); // consume GIVEN token
  stream.expectThenAdvance(TokenType.LBRACE);
  const body = parseBlockBody(stream);
  stream.expectThenAdvance(TokenType.RBRACE);

  return {
    type: 'Function',
    given: givenToken.value as string[],
    body,
  };
}
