import { FunctionNode } from '../../parser';
import { Context } from '../types';
import { evalNode } from '../eval-node';

export function evalFunction(node: FunctionNode, context: Context): (...args: unknown[]) => unknown {
  const { params, body } = node;

  return function (...args: unknown[]): unknown {
    const fnScope: Context = { ...context };
    for (let i = 0; i < params.length; i++) {
      fnScope[params[i]] = args[i];
    }
    return evalNode(body, fnScope);
  };
}
