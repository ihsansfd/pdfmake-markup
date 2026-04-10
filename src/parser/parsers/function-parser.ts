import { TokenType } from '../../lexer';
import { ASTNode, FunctionNode } from '../types';
import { TokenStream } from '../token-stream';
import { parseObjectProperties } from './object-parser';
import { parseValue } from './value-parser';

function parseFunctionBody(stream: TokenStream): ASTNode {
  const tok = stream.current();
  const next = stream.peek();

  // If current is identifier/string followed by colon → object body (braces already consumed)
  const isObjectBody =
    (tok.type === TokenType.IDENTIFIER || tok.type === TokenType.STRING) &&
    next?.type === TokenType.COLON;

  if (isObjectBody) {
    const properties = parseObjectProperties(stream);
    return { type: 'Object', properties };
  }

  return parseValue(stream);
}

export function parseFunction(stream: TokenStream): FunctionNode {
  const paramsTok = stream.advance(); // consume PARAMS token
  stream.expect(TokenType.LBRACE);
  const body = parseFunctionBody(stream);
  stream.expect(TokenType.RBRACE);

  return {
    type: 'Function',
    params: paramsTok.value as string[],
    body,
  };
}
