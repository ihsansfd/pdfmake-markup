import { tokenize } from './lexer';
import { parse } from './parser';
import { evaluate, Vars } from './evaluator';

export { TokenType, Token, LexerError } from './lexer';
export { ASTNode, ParseError } from './parser';
export { EvalError, Vars } from './evaluator';

export function decode(markup: string, vars: Vars = {}): unknown {
  const tokens = tokenize(markup);
  const ast = parse(tokens);
  return evaluate(ast, vars);
}
