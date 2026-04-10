import { FunctionNode } from '../../parser';
import { Vars } from '../types';
import { evalNode } from '../eval-node';

export function evalFunction(node: FunctionNode, vars: Vars): (...args: unknown[]) => unknown {
  const { given, body } = node;

  return function (...args: unknown[]): unknown {
    const fnScope: Vars = { ...vars };
    for (let i = 0; i < given.length; i++) {
      fnScope[given[i]] = args[i];
    }
    return evalNode(body, fnScope);
  };
}
