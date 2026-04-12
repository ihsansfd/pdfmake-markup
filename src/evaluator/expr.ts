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

function replaceOutsideStrings(input: string, transform: (segment: string) => string): string {
  let result = '';
  let segmentStart = 0;
  let quote: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quote !== null) {
      if (char === '\\') {
        i++;
        continue;
      }
      if (char === quote) {
        result += input.slice(segmentStart, i + 1);
        segmentStart = i + 1;
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === '\'') {
      result += transform(input.slice(segmentStart, i));
      segmentStart = i;
      quote = char;
      continue;
    }
  }
  return result + transform(input.slice(segmentStart));
}

function preprocessExpr(exprStr: string): string {
  // Convert .length on arrays/strings to (expr|length). Must run before the
  // `::length` rewrite so we don't accidentally pipe our injected $loops entry.
  return replaceOutsideStrings(exprStr, (segment) => {
    let processed = segment.replace(
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
  });
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
