import { TokenType } from '../../lexer';
import { ASTNode, IfNode } from '../types';
import { TokenStream } from '../token-stream';
import { parseValue } from './value-parser';
import { parseBlockBody } from './function-parser';

export function parseIf(stream: TokenStream): IfNode {
  stream.expectThenAdvance(TokenType.IF);
  stream.expectThenAdvance(TokenType.LPAREN);
  const cond = parseValue(stream);
  stream.expectThenAdvance(TokenType.RPAREN);

  stream.expectThenAdvance(TokenType.LBRACE);
  const thenBody = parseBlockBody(stream);
  stream.expectThenAdvance(TokenType.RBRACE);

  let elseBody: ASTNode | undefined;
  if (stream.current().type === TokenType.ELSE) {
    stream.advance();
    if (stream.current().type === TokenType.IF) {
      elseBody = parseIf(stream);
    } else {
      stream.expectThenAdvance(TokenType.LBRACE);
      elseBody = parseBlockBody(stream);
      stream.expectThenAdvance(TokenType.RBRACE);
    }
  }

  return { type: 'If', cond, then: thenBody, else: elseBody };
}
