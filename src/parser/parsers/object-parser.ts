import { TokenType } from '../../lexer';
import { ObjectNode, ObjectProperty } from '../types';
import { TokenStream } from '../token-stream';
import { ParseError } from '../errors';
import { parseValue } from './value-parser';

export function parseObjectProperties(stream: TokenStream): ObjectProperty[] {
  const properties: ObjectProperty[] = [];

  while (stream.current().type !== TokenType.RBRACE) {
    const keyTok = stream.current();

    if (keyTok.type !== TokenType.IDENTIFIER && keyTok.type !== TokenType.STRING) {
      throw new ParseError(`Expected property key, got ${keyTok.type}`, keyTok);
    }

    const key = keyTok.value as string;
    stream.advance();
    stream.expect(TokenType.COLON);

    const value = parseValue(stream);
    properties.push({ key, value });

    stream.skipIf(TokenType.COMMA);
  }

  return properties;
}

export function parseObject(stream: TokenStream): ObjectNode {
  stream.expect(TokenType.LBRACE);
  const properties = parseObjectProperties(stream);
  stream.expect(TokenType.RBRACE);
  return { type: 'Object', properties };
}
