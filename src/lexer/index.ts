import { Token, TokenType } from './types';
import { LexerError } from './errors';
import { Scanner } from './scanner';
import { readString, readNumber, readIdentifierOrKeyword, readExprOrVar } from './readers';

export { Token, TokenType } from './types';
export { LexerError } from './errors';

type CharHandler = (scanner: Scanner) => Token;

const SINGLE_CHAR_TOKENS: Record<string, TokenType> = {
  '{': TokenType.LBRACE,
  '}': TokenType.RBRACE,
  '[': TokenType.LBRACKET,
  ']': TokenType.RBRACKET,
  ':': TokenType.COLON,
  ',': TokenType.COMMA,
};

function createPunctuationHandler(type: TokenType): CharHandler {
  return (scanner) => {
    const token: Token = {
      type,
      value: scanner.current()!,
      line: scanner.currentLine,
      col: scanner.currentCol,
    };
    scanner.advance();
    return token;
  };
}

function buildCharHandlers(): Map<string, CharHandler> {
  const handlers = new Map<string, CharHandler>();

  for (const [char, type] of Object.entries(SINGLE_CHAR_TOKENS)) {
    handlers.set(char, createPunctuationHandler(type));
  }

  handlers.set('"', (scanner) => readString(scanner, '"'));
  handlers.set("'", (scanner) => readString(scanner, "'"));

  return handlers;
}

const charHandlers = buildCharHandlers();

function resolveHandler(scanner: Scanner): CharHandler {
  const current = scanner.current()!;

  // Two-char token: %{
  if (current === '%' && scanner.peek() === '{') {
    return readExprOrVar;
  }

  const handler = charHandlers.get(current);
  if (handler) return handler;

  // Negative number
  if (current === '-' && /[0-9]/.test(scanner.peek() ?? '')) {
    return readNumber;
  }

  if (/[0-9]/.test(current)) return readNumber;
  if (/[a-zA-Z_$]/.test(current)) return readIdentifierOrKeyword;

  throw new LexerError(`Unexpected character: ${current}`, scanner.currentLine, scanner.currentCol);
}

export function tokenize(input: string): Token[] {
  const scanner = new Scanner(input);
  const tokens: Token[] = [];

  while (!scanner.isAtEnd) {
    scanner.skipWhitespaceAndComments();
    if (scanner.isAtEnd) break;

    const handler = resolveHandler(scanner);
    tokens.push(handler(scanner));
  }

  tokens.push({ type: TokenType.EOF, value: null, line: scanner.currentLine, col: scanner.currentCol });
  return tokens;
}
