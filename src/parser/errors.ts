import { Token } from '../lexer';

export class ParseError extends Error {
  token: Token | undefined;

  constructor(message: string, token?: Token) {
    const loc = token ? ` at line ${token.line}, column ${token.col}` : '';
    super(`${message}${loc}`);
    this.name = 'ParseError';
    this.token = token;
  }
}
