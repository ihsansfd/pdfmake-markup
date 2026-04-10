import { TokenType } from '../../lexer';
import { ObjectNode, ObjectProperty } from '../types';
import { TokenStream } from '../token-stream';
import { ParseError } from '../errors';
import { parseValue } from './value-parser';

export function parseObjectProperties(stream: TokenStream): ObjectProperty[] {
  const properties: ObjectProperty[] = [];

  while (stream.current().type !== TokenType.RBRACE) {
    const keyToken = stream.current();

    if (keyToken.type !== TokenType.IDENTIFIER && keyToken.type !== TokenType.STRING) {
      throw new ParseError(`Expected property key, got ${keyToken.type}`, keyToken);
    }

    const key = keyToken.value as string;
    stream.advance();
    stream.expectThenAdvance(TokenType.COLON);

    const value = parseValue(stream);
    properties.push({ key, value });

    stream.skipIf(TokenType.COMMA);
  }

  return properties;
}

export function parseObject(stream: TokenStream): ObjectNode {
  stream.expectThenAdvance(TokenType.LBRACE);
  const properties = parseObjectProperties(stream);
  stream.expectThenAdvance(TokenType.RBRACE);
  return { type: 'Object', properties };
}
