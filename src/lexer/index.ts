import { Token, TokenType } from "./types";
import { LexerError } from "./errors";
import { Scanner } from "./scanner";
import {
  readString,
  readNumber,
  readIdentifierOrKeyword,
  readExpr,
} from "./readers";

export { Token, TokenType } from "./types";
export { LexerError } from "./errors";

type CharHandler = (scanner: Scanner) => Token;

function directValueToken(type: TokenType, value: string): CharHandler {
  return (scanner) => {
    const token: Token = {
      type,
      value,
      line: scanner.currentLine,
      col: scanner.currentCol,
    };
    scanner.advance(value.length);
    return token;
  };
}

const HANDLER_CHAIN: [(c: string, s: Scanner) => boolean, CharHandler][] = [
  // Multi-char tokens
  [(c, s) => c === "%" && s.peek() === "{", readExpr],
  [(c, s) => c === "." && s.peek() === "." && s.peek(2) === ".", directValueToken(TokenType.SPREAD, "...")],

  // Single-char tokens
  [(c) => c === "{", directValueToken(TokenType.LBRACE, "{")],
  [(c) => c === "}", directValueToken(TokenType.RBRACE, "}")],
  [(c) => c === "[", directValueToken(TokenType.LBRACKET, "[")],
  [(c) => c === "]", directValueToken(TokenType.RBRACKET, "]")],
  [(c) => c === "(", directValueToken(TokenType.LPAREN, "(")],
  [(c) => c === ")", directValueToken(TokenType.RPAREN, ")")],
  [(c) => c === ":", directValueToken(TokenType.COLON, ":")],
  [(c) => c === ",", directValueToken(TokenType.COMMA, ",")],
  [(c) => c === '"', (s) => readString(s, '"')],
  [(c) => c === "'", (s) => readString(s, "'")],

  // Numbers (including negative)
  [(c, s) => c === "-" && /[0-9]/.test(s.peek() ?? ""), readNumber],
  [(c) => /[0-9]/.test(c), readNumber],

  // Identifiers and keywords
  [(c) => /[a-zA-Z_$]/.test(c), readIdentifierOrKeyword],
];

function resolveHandler(scanner: Scanner): CharHandler {
  const current = scanner.current()!;

  for (const [match, handler] of HANDLER_CHAIN) {
    if (match(current, scanner)) return handler;
  }

  throw new LexerError(
    `Unexpected character: ${current}`,
    scanner.currentLine,
    scanner.currentCol,
  );
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

  tokens.push({
    type: TokenType.EOF,
    value: null,
    line: scanner.currentLine,
    col: scanner.currentCol,
  });
  return tokens;
}
