import { TokenType } from '../../lexer';
import { ASTNode, FunctionNode } from '../types';
import { TokenStream } from '../token-stream';
import { parseObjectProperties } from './object-parser';
import { parseValue } from './value-parser';

function parseFunctionBody(stream: TokenStream): ASTNode {
  const token = stream.current();
  const next = stream.peek();

  // If current is identifier/string followed by colon → object body (braces already consumed)
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
  const paramsToken = stream.advance(); // consume PARAMS token
  stream.expectThenAdvance(TokenType.LBRACE);
  const body = parseFunctionBody(stream);
  stream.expectThenAdvance(TokenType.RBRACE);

  return {
    type: 'Function',
    params: paramsToken.value as string[],
    body,
  };
}
