import { TokenType } from '../../lexer';
import { ASTNode } from '../types';
import { TokenStream } from '../token-stream';
import { ParseError } from '../errors';
import { parseLiteral } from './literal-parser';
import { parseExpr } from './expr-parser';
import { parseVar } from './var-parser';
import { parseObject } from './object-parser';
import { parseArray } from './array-parser';
import { parseFunction } from './function-parser';

type ValueParser = (stream: TokenStream) => ASTNode;

const VALUE_PARSERS: Record<string, ValueParser> = {
  [TokenType.LBRACE]:    parseObject,
  [TokenType.LBRACKET]:  parseArray,
  [TokenType.PARAMS]:    parseFunction,
  [TokenType.EXPR]:      parseExpr,
  [TokenType.VAR]:       parseVar,
  [TokenType.STRING]:    parseLiteral,
  [TokenType.NUMBER]:    parseLiteral,
  [TokenType.BOOLEAN]:   parseLiteral,
  [TokenType.NULL]:      parseLiteral,
};

export function parseValue(stream: TokenStream): ASTNode {
  const tok = stream.current();
  const parser = VALUE_PARSERS[tok.type];

  if (!parser) {
    throw new ParseError(
      `Unexpected token: ${tok.type} (${JSON.stringify(tok.value)})`,
      tok,
    );
  }

  return parser(stream);
}
