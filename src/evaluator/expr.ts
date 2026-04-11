import jexl from 'jexl';
import { EvalError } from './errors';
import { Vars } from './types';

// Transforms for JS-like property access
jexl.addTransform('length', (val: unknown) => {
  if (Array.isArray(val) || typeof val === 'string') return val.length;
  return undefined;
});

// Sentinel for null since jexl doesn't support null literals
const NULL_SENTINEL = '__pdfmk_null__';
jexl.addTransform('__null__', () => null);

function preprocessExpr(exprStr: string): string {
  // Convert .length on arrays/strings to (expr|length). Must run before the
  // `::length` rewrite so we don't accidentally pipe our injected $loops entry.
  let processed = exprStr.replace(
    /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[[^\]]+\])*)\.length\b/g,
    '($1|length)',
  );
  // Convert loop-scoped meta `name::index` / `name::length` → `$loops.name.index`
  processed = processed.replace(
    /([a-zA-Z_$][a-zA-Z0-9_$]*)::(index|length)\b/g,
    '$loops.$1.$2',
  );
  // Convert null literal to a sentinel that resolves to null
  processed = processed.replace(/\bnull\b/g, `"${NULL_SENTINEL}"|__null__`);
  return processed;
}

export function evalExpression(exprStr: string, scope: Vars): unknown {
  try {
    const processed = preprocessExpr(exprStr);
    return jexl.evalSync(processed, scope);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new EvalError(`Failed to evaluate expression: ${exprStr}\n  ${message}`);
  }
}
