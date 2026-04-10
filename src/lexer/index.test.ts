import { tokenize, TokenType, LexerError } from './index';

describe('Lexer', () => {
  it('tokenizes simple object', () => {
    const tokens = tokenize('{ name: "hello" }');
    const types = tokens.map(t => t.type);
    expect(types).toEqual([
      TokenType.LBRACE,
      TokenType.IDENTIFIER,
      TokenType.COLON,
      TokenType.STRING,
      TokenType.RBRACE,
      TokenType.EOF,
    ]);
  });

  it('tokenizes numbers', () => {
    const tokens = tokenize('{ a: 42, b: -3.14 }');
    const numTokens = tokens.filter(t => t.type === TokenType.NUMBER);
    expect(numTokens[0]!.value).toBe(42);
    expect(numTokens[1]!.value).toBeCloseTo(-3.14);
  });

  it('tokenizes booleans and null', () => {
    const tokens = tokenize('{ a: true, b: false, c: null }');
    const boolTokens = tokens.filter(t => t.type === TokenType.BOOLEAN);
    const nullTokens = tokens.filter(t => t.type === TokenType.NULL);
    expect(boolTokens).toHaveLength(2);
    expect(boolTokens[0]!.value).toBe(true);
    expect(boolTokens[1]!.value).toBe(false);
    expect(nullTokens).toHaveLength(1);
    expect(nullTokens[0]!.value).toBe(null);
  });

  it('tokenizes arrays', () => {
    const tokens = tokenize('[1, 2, 3]');
    const types = tokens.map(t => t.type);
    expect(types).toEqual([
      TokenType.LBRACKET,
      TokenType.NUMBER, TokenType.COMMA,
      TokenType.NUMBER, TokenType.COMMA,
      TokenType.NUMBER,
      TokenType.RBRACKET,
      TokenType.EOF,
    ]);
  });

  it('tokenizes string with escapes', () => {
    const tokens = tokenize("{ text: 'it\\'s a test\\n' }");
    const strToken = tokens.find(t => t.type === TokenType.STRING);
    expect(strToken!.value).toBe("it's a test\n");
  });

  it('tokenizes %{var:name}%', () => {
    const tokens = tokenize('%{var:myVar}%');
    expect(tokens[0]!.type).toBe(TokenType.VAR);
    expect(tokens[0]!.value).toBe('myVar');
  });

  it('tokenizes %{expression}%', () => {
    const tokens = tokenize('%{x + 1}%');
    expect(tokens[0]!.type).toBe(TokenType.EXPR);
    expect(tokens[0]!.value).toBe('x + 1');
  });

  it('tokenizes params(...)', () => {
    const tokens = tokenize('params(a, b, c) { }');
    expect(tokens[0]!.type).toBe(TokenType.PARAMS);
    expect(tokens[0]!.value).toEqual(['a', 'b', 'c']);
  });

  it('skips line comments', () => {
    const tokens = tokenize('{\n// this is a comment\na: 1\n}');
    const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
    expect(types).toEqual([
      TokenType.LBRACE,
      TokenType.IDENTIFIER,
      TokenType.COLON,
      TokenType.NUMBER,
      TokenType.RBRACE,
    ]);
  });

  it('skips block comments', () => {
    const tokens = tokenize('{ /* comment */ a: 1 }');
    const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
    expect(types).toEqual([
      TokenType.LBRACE,
      TokenType.IDENTIFIER,
      TokenType.COLON,
      TokenType.NUMBER,
      TokenType.RBRACE,
    ]);
  });

  it('handles nested braces inside expressions', () => {
    const tokens = tokenize('%{(a > 0) ? {x: 1} : {x: 2}}%');
    expect(tokens[0]!.type).toBe(TokenType.EXPR);
    expect(tokens[0]!.value).toBe('(a > 0) ? {x: 1} : {x: 2}');
  });

  it('throws on unterminated string', () => {
    expect(() => tokenize('"hello')).toThrow(LexerError);
  });

  it('throws on unexpected character', () => {
    expect(() => tokenize('{ a: @ }')).toThrow(LexerError);
  });

  it('tracks line and column numbers', () => {
    const tokens = tokenize('{\n  a: 1\n}');
    const identToken = tokens.find(t => t.type === TokenType.IDENTIFIER);
    expect(identToken!.line).toBe(2);
    expect(identToken!.col).toBe(3);
  });
});
