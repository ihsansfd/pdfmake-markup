import { tokenize } from './lexer';
import { parse } from './parser';
import { evaluate, Context } from './evaluator';

export { TokenType, Token, LexerError } from './lexer';
export { ASTNode, ParseError } from './parser';
export { EvalError, Context } from './evaluator';

export function decode(markup: string, context: Context = {}): unknown {
  const tokens = tokenize(markup);
  const ast = parse(tokens);
  return evaluate(ast, context);
}
