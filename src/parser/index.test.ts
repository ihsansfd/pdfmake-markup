import { tokenize } from '../lexer';
import { parse, ParseError, ObjectNode, FunctionNode, ArrayNode } from './index';

function parseStr(input: string) {
  return parse(tokenize(input));
}

describe('Parser', () => {
  it('parses a simple object', () => {
    const ast = parseStr('{ a: 1, b: "hello" }') as ObjectNode;
    expect(ast.type).toBe('Object');
    expect(ast.properties).toHaveLength(2);
    expect(ast.properties[0]!.key).toBe('a');
    expect(ast.properties[0]!.value).toEqual({ type: 'Literal', value: 1 });
    expect(ast.properties[1]!.key).toBe('b');
    expect(ast.properties[1]!.value).toEqual({ type: 'Literal', value: 'hello' });
  });

  it('parses nested objects', () => {
    const ast = parseStr('{ a: { b: 1 } }') as ObjectNode;
    const inner = ast.properties[0]!.value as ObjectNode;
    expect(inner.type).toBe('Object');
    expect(inner.properties[0]!.key).toBe('b');
  });

  it('parses arrays', () => {
    const ast = parseStr('[1, "two", true]') as ArrayNode;
    expect(ast.type).toBe('Array');
    expect(ast.elements).toHaveLength(3);
    expect(ast.elements[0]).toEqual({ type: 'Literal', value: 1 });
    expect(ast.elements[1]).toEqual({ type: 'Literal', value: 'two' });
    expect(ast.elements[2]).toEqual({ type: 'Literal', value: true });
  });

  it('parses var references', () => {
    const ast = parseStr('{ text: %{var:myText}% }') as ObjectNode;
    expect(ast.properties[0]!.value).toEqual({ type: 'Var', name: 'myText' });
  });

  it('parses expressions', () => {
    const ast = parseStr('{ size: %{base * 2}% }') as ObjectNode;
    expect(ast.properties[0]!.value).toEqual({ type: 'Expr', expression: 'base * 2' });
  });

  it('parses a function with object body', () => {
    const ast = parseStr('params(a, b) { x: %{a + b}% }') as FunctionNode;
    expect(ast.type).toBe('Function');
    expect(ast.params).toEqual(['a', 'b']);
    const body = ast.body as ObjectNode;
    expect(body.type).toBe('Object');
    expect(body.properties[0]!.key).toBe('x');
  });

  it('parses a function with expression body', () => {
    const ast = parseStr('params(row) { %{(row + 1) * 25}% }') as FunctionNode;
    expect(ast.type).toBe('Function');
    expect(ast.params).toEqual(['row']);
    expect(ast.body.type).toBe('Expr');
    expect((ast.body as any).expression).toBe('(row + 1) * 25');
  });

  it('parses function as object property value', () => {
    const ast = parseStr('{ heights: params(row) { %{(row + 1) * 25}% } }') as ObjectNode;
    expect(ast.properties[0]!.key).toBe('heights');
    expect(ast.properties[0]!.value.type).toBe('Function');
  });

  it('parses trailing commas', () => {
    const ast = parseStr('{ a: 1, b: 2, }') as ObjectNode;
    expect(ast.properties).toHaveLength(2);
  });

  it('parses complex nested structure', () => {
    const ast = parseStr(`{
      content: [
        { text: "hello", bold: true },
        "plain string",
        { table: { body: [[1, 2], [3, 4]] } }
      ]
    }`) as ObjectNode;
    expect(ast.type).toBe('Object');
    expect(ast.properties[0]!.key).toBe('content');
    const content = ast.properties[0]!.value as ArrayNode;
    expect(content.type).toBe('Array');
    expect(content.elements).toHaveLength(3);
  });

  it('throws on unexpected token', () => {
    expect(() => parseStr('{ a: }')).toThrow(ParseError);
  });

  it('parses quoted keys', () => {
    const ast = parseStr('{ "my-key": 1 }') as ObjectNode;
    expect(ast.properties[0]!.key).toBe('my-key');
  });
});
