import { Token, TokenType } from '../lexer';
import { ParseError } from './errors';

export class TokenStream {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  current(): Token {
    return this.tokens[this.pos];
  }

  peek(offset = 1): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  expect(type: TokenType): Token {
    const tok = this.current();
    if (tok.type !== type) {
      throw new ParseError(
        `Expected ${type}, got ${tok.type} (${JSON.stringify(tok.value)})`,
        tok,
      );
    }
    return this.advance();
  }

  skipIf(type: TokenType): boolean {
    if (this.current().type === type) {
      this.advance();
      return true;
    }
    return false;
  }
}
