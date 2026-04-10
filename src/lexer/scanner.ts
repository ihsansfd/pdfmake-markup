import { LexerError } from './errors';

export class Scanner {
  private pos = 0;
  private line = 1;
  private col = 1;

  constructor(private readonly input: string) {}

  get position(): number { return this.pos; }
  get currentLine(): number { return this.line; }
  get currentCol(): number { return this.col; }
  get isAtEnd(): boolean { return this.pos >= this.input.length; }

  current(): string | undefined {
    return this.input[this.pos];
  }

  peek(offset = 1): string | undefined {
    return this.input[this.pos + offset];
  }

  remaining(): string {
    return this.input.slice(this.pos);
  }

  advance(n = 1): void {
    for (let i = 0; i < n; i++) {
      if (this.input[this.pos] === '\n') {
        this.line++;
        this.col = 1;
      } else {
        this.col++;
      }
      this.pos++;
    }
  }

  skipWhitespace(): void {
    while (!this.isAtEnd && /\s/.test(this.input[this.pos])) {
      this.advance();
    }
  }

  skipWhitespaceAndComments(): void {
    while (!this.isAtEnd) {
      this.skipWhitespace();
      if (this.current() === '/' && this.peek() === '/') {
        this.skipLineComment();
      } else if (this.current() === '/' && this.peek() === '*') {
        this.skipBlockComment();
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    this.advance(2);
    while (!this.isAtEnd && this.input[this.pos] !== '\n') {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(2);
    while (!this.isAtEnd) {
      if (this.current() === '*' && this.peek() === '/') {
        this.advance(2);
        return;
      }
      this.advance();
    }
    throw new LexerError('Unterminated block comment', startLine, startCol);
  }
}
