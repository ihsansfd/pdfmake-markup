import { TokenType } from '../../lexer';
import { ASTNode, FunctionNode } from '../types';
import { TokenStream } from '../token-stream';
import { parseValue } from './value-parser';

export function parseBlockBody(stream: TokenStream): ASTNode {
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
