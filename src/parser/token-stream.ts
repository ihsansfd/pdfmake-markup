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
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  expectThenAdvance(type: TokenType): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new ParseError(
        `Expected ${type}, got ${token.type} (${JSON.stringify(token.value)})`,
        token,
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
