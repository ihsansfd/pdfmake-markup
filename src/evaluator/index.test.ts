import { decode } from '../index';

describe('decode', () => {
  it('decodes a simple object', () => {
    const result = decode('{ a: 1, b: "hello", c: true, d: null }') as any;
    expect(result).toEqual({ a: 1, b: 'hello', c: true, d: null });
  });

  it('decodes nested objects and arrays', () => {
    const result = decode('{ items: [1, 2, { nested: true }] }') as any;
    expect(result).toEqual({ items: [1, 2, { nested: true }] });
  });

  it('substitutes variables', () => {
    const result = decode('{ text: %{var:name}% }', { name: 'Alice' }) as any;
    expect(result).toEqual({ text: 'Alice' });
  });

  it('evaluates expressions with vars', () => {
    const result = decode('{ size: %{base * 2}% }', { base: 10 }) as any;
    expect(result).toEqual({ size: 20 });
  });

  it('evaluates ternary expressions', () => {
    const result = decode('{ val: %{x > 5 ? 1 : 0}% }', { x: 10 }) as any;
    expect(result).toEqual({ val: 1 });
  });

  it('decodes a function that returns an expression', () => {
    const result = decode('{ heights: given(row) { %{(row + 1) * 25}% } }') as any;
    expect(typeof result.heights).toBe('function');
    expect(result.heights(0)).toBe(25);
    expect(result.heights(1)).toBe(50);
    expect(result.heights(2)).toBe(75);
  });

  it('decodes a function that returns an object', () => {
    const result = decode(`{
      margins: given(currentPage, pageCount, pageSize) {
        left: %{currentPage == 1 ? 80 : 40}%,
        top: 40,
        right: %{currentPage == 1 ? 40 : 80}%,
        bottom: 40
      }
    }`) as any;
    expect(typeof result.margins).toBe('function');
    expect(result.margins(1, 5, {})).toEqual({
      left: 80, top: 40, right: 40, bottom: 40,
    });
    expect(result.margins(2, 5, {})).toEqual({
      left: 40, top: 40, right: 80, bottom: 40,
    });
  });

  it('function body can access decode vars', () => {
    const result = decode(
      '{ calc: given(x) { %{x + offset}% } }',
      { offset: 100 }
    ) as any;
    expect(result.calc(5)).toBe(105);
  });

  it('decodes a pdfmake-like document', () => {
    const result = decode(`{
      content: [
        { text: %{var:title}%, bold: true, fontSize: 18 },
        "Some plain text",
        {
          table: {
            headerRows: 1,
            widths: [100, '*', 80],
            body: [
              ["Item", "Desc", "Price"],
              [%{var:item1}%, "Widget", 10]
            ]
          },
          layout: {
            hLineWidth: given(i, node) { %{i == 0 ? 2 : 1}% }
          }
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true }
      }
    }`, { title: 'Invoice', item1: 'Gadget' }) as any;

    expect(result.content[0]).toEqual({ text: 'Invoice', bold: true, fontSize: 18 });
    expect(result.content[1]).toBe('Some plain text');
    expect(result.content[2].table.body[1][0]).toBe('Gadget');
    expect(typeof result.content[2].layout.hLineWidth).toBe('function');
    expect(result.content[2].layout.hLineWidth(0)).toBe(2);
    expect(result.content[2].layout.hLineWidth(1)).toBe(1);
    expect(result.styles).toEqual({ header: { fontSize: 18, bold: true } });
  });

  it('throws on undefined variable', () => {
    expect(() => decode('{ x: %{var:missing}% }')).toThrow('Undefined variable: missing');
  });

  it('handles comments', () => {
    const result = decode(`{
      // line comment
      a: 1,
      /* block
         comment */
      b: 2
    }`) as any;
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('decodes the sample-query.pdfmk pattern', () => {
    const loremIpsum = 'Lorem ipsum dolor sit amet. ';
    const result = decode(`{
      pageMargins:
        given(currentPage, pageCount, pageSize) {
          left: %{currentPage == 1 ? 80 : 40}%,
          top: 40,
          right: %{currentPage == 1 ? 40 : 80}%,
          bottom: 40
        },
      content: [
        { text: %{var:text}% },
        '',
        'Table:',
        {
          table: {
            body: [
              [{ text: 'Header 1', style: 'tableHeader' }, { text: 'Header 2', style: 'tableHeader' }],
              [%{var:text}%, %{var:text}%]
            ]
          }
        }
      ]
    }`, { text: loremIpsum }) as any;

    expect(typeof result.pageMargins).toBe('function');
    expect(result.pageMargins(1, 1, {})).toEqual({ left: 80, top: 40, right: 40, bottom: 40 });
    expect(result.content[0]).toEqual({ text: loremIpsum });
    expect(result.content[2]).toBe('Table:');
    expect(result.content[3].table.body[1]).toEqual([loremIpsum, loremIpsum]);
  });

  it('decodes function returning a literal', () => {
    const result = decode('{ fn: given(x) { %{x * 2}% } }') as any;
    expect(result.fn(5)).toBe(10);
    expect(result.fn(0)).toBe(0);
  });

  it('decodes function returning an array', () => {
    const result = decode('{ fn: given(x) { [%{x}%, %{x + 1}%] } }') as any;
    expect(result.fn(3)).toEqual([3, 4]);
  });

  it('supports property access in expressions', () => {
    const result = decode(`{
      layout: {
        hLineWidth: given(i, node) {
          %{(i == 0 || i == node.table.body|length) ? 2 : 1}%
        }
      }
    }`) as any;
    const node = { table: { body: [['a'], ['b'], ['c']] } };
    expect(result.layout.hLineWidth(0, node)).toBe(2);
    expect(result.layout.hLineWidth(3, node)).toBe(2);
    expect(result.layout.hLineWidth(1, node)).toBe(1);
  });

  it('supports .length auto-converted to |length', () => {
    const result = decode(`{
      fn: given(i, node) {
        %{i == node.items.length ? "last" : "other"}%
      }
    }`) as any;
    expect(result.fn(3, { items: [1, 2, 3] })).toBe('last');
    expect(result.fn(1, { items: [1, 2, 3] })).toBe('other');
  });

  it('decodes pdfmake zebra stripe pattern', () => {
    const result = decode(`{
      layout: {
        fillColor: given(rowIndex, node, columnIndex) {
          %{rowIndex % 2 == 0 ? "#CCCCCC" : null}%
        }
      }
    }`) as any;
    expect(result.layout.fillColor(0, {}, 0)).toBe('#CCCCCC');
    expect(result.layout.fillColor(1, {}, 0)).toBe(null);
    expect(result.layout.fillColor(2, {}, 0)).toBe('#CCCCCC');
  });

  it('decodes undefined values', () => {
    const result = decode('{ border: undefined }') as any;
    expect(result).toEqual({ border: undefined });
    expect('border' in result).toBe(true);
  });
});
