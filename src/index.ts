import { tokenize } from './lexer';
import { parse } from './parser';
import { evaluate } from './evaluator';

export { TokenType, Token, LexerError } from './lexer';
export { ASTNode, ParseError } from './parser';
export { EvalError } from './evaluator';

export function decode(markup: string): unknown {
  const tokens = tokenize(markup);
  const ast = parse(tokens);
  return evaluate(ast);
}
