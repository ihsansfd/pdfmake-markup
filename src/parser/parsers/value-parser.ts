import { TokenType } from '../../lexer';
import { ASTNode } from '../types';
import { TokenStream } from '../token-stream';
import { ParseError } from '../errors';
import { parseLiteral } from './literal-parser';
import { parseExpr } from './expr-parser';
import { parseObject } from './object-parser';
import { parseArray } from './array-parser';
import { parseFunction } from './function-parser';
import { parseMap } from './map-parser';
import { parseIf } from './if-parser';

type ValueParser = (stream: TokenStream) => ASTNode;

const VALUE_PARSERS: Record<string, ValueParser> = {
  [TokenType.LBRACE]:    parseObject,
  [TokenType.LBRACKET]:  parseArray,
  [TokenType.GIVEN]:     parseFunction,
  [TokenType.MAP]:       parseMap,
  [TokenType.IF]:        parseIf,
  [TokenType.EXPR]:      parseExpr,
  [TokenType.STRING]:    parseLiteral,
  [TokenType.NUMBER]:    parseLiteral,
  [TokenType.BOOLEAN]:   parseLiteral,
  [TokenType.NULL]:      parseLiteral,
};

export function parseValue(stream: TokenStream): ASTNode {
  const token = stream.current();
  const parser = VALUE_PARSERS[token.type];

  if (!parser) {
    throw new ParseError(
      `Unexpected token: ${token.type} (${JSON.stringify(token.value)})`,
      token,
    );
  }

  return parser(stream);
}
