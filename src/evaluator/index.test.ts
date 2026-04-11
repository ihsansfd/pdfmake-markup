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

  it('expands for loop inside an array', () => {
    const result = decode(
      '{ content: [for(item in %{var:items}%) { { text: %{item.name}% } }] }',
      { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] },
    ) as any;
    expect(result.content).toEqual([
      { text: 'a' },
      { text: 'b' },
      { text: 'c' },
    ]);
  });

  it('uses name::index for first/last detection', () => {
    const result = decode(
      '{ items: [for(r in %{var:rows}%) { { text: %{r}%, isFirst: %{r::index == 0}%, isLast: %{r::index == r::length - 1}% } }] }',
      { rows: ['a', 'b', 'c'] },
    ) as any;
    expect(result.items[0]).toMatchObject({ isFirst: true, isLast: false });
    expect(result.items[1]).toMatchObject({ isFirst: false, isLast: false });
    expect(result.items[2]).toMatchObject({ isFirst: false, isLast: true });
  });

  it('for loop as top-level value', () => {
    const result = decode(
      'for(n in %{var:nums}%) { %{n * 2}% }',
      { nums: [1, 2, 3] },
    ) as any;
    expect(result).toEqual([2, 4, 6]);
  });

  it('for loop with implicit object body', () => {
    const result = decode(
      '{ rows: [for(row in %{var:rows}%) { text: %{row}%, bold: true }] }',
      { rows: ['a', 'b'] },
    ) as any;
    expect(result.rows).toEqual([
      { text: 'a', bold: true },
      { text: 'b', bold: true },
    ]);
  });

  it('if with true condition picks then branch', () => {
    const result = decode(
      '{ content: [{ text: "header" }, if(%{var:show}%) { { text: "inner" } }] }',
      { show: true },
    ) as any;
    expect(result.content).toEqual([{ text: 'header' }, { text: 'inner' }]);
  });

  it('if with false condition and no else is skipped in array', () => {
    const result = decode(
      '{ content: [{ text: "a" }, if(%{var:show}%) { { text: "b" } }, { text: "c" }] }',
      { show: false },
    ) as any;
    expect(result.content).toEqual([{ text: 'a' }, { text: 'c' }]);
  });

  it('if with else branch', () => {
    const result = decode(
      '{ content: [if(%{var:premium}%) { { text: "Gold" } } else { { text: "Free" } }] }',
      { premium: false },
    ) as any;
    expect(result.content).toEqual([{ text: 'Free' }]);
  });

  it('if with else if chain', () => {
    const markup = `{
      content: [
        if(%{tier == "a"}%) { { text: "A" } }
        else if(%{tier == "b"}%) { { text: "B" } }
        else { { text: "other" } }
      ]
    }`;
    expect((decode(markup, { tier: 'a' }) as any).content).toEqual([{ text: 'A' }]);
    expect((decode(markup, { tier: 'b' }) as any).content).toEqual([{ text: 'B' }]);
    expect((decode(markup, { tier: 'c' }) as any).content).toEqual([{ text: 'other' }]);
  });

  it('nested for loops', () => {
    const result = decode(
      '{ grid: [for(row in %{var:rows}%) { [for(col in %{row}%) { %{col}% }] }] }',
      { rows: [[1, 2], [3, 4]] },
    ) as any;
    expect(result.grid).toEqual([[1, 2], [3, 4]]);
  });

  it('for + if combined', () => {
    const result = decode(
      '{ items: [for(n in %{var:nums}%) { if(%{n > 2}%) { %{n}% } }] }',
      { nums: [1, 2, 3, 4, 5] },
    ) as any;
    expect(result.items).toEqual([3, 4, 5]);
  });

  it('for loop inside given body uses argument as iterable', () => {
    const result = decode(
      '{ fn: given(rows) { [for(r in %{rows}%) { %{r * 10}% }] } }',
    ) as any;
    expect(result.fn([1, 2, 3])).toEqual([10, 20, 30]);
  });

  it('loop-scoped meta via name::index and name::length', () => {
    const result = decode(
      '{ items: [for(row in %{var:rows}%) { { n: %{row}%, idx: %{row::index}%, total: %{row::length}% } }] }',
      { rows: ['a', 'b', 'c'] },
    ) as any;
    expect(result.items).toEqual([
      { n: 'a', idx: 0, total: 3 },
      { n: 'b', idx: 1, total: 3 },
      { n: 'c', idx: 2, total: 3 },
    ]);
  });

  it('nested loops keep independent index/length via name::', () => {
    const result = decode(
      `{
        grid: [for(row in %{var:rows}%) {
          [for(col in %{row.cells}%) {
            {
              value: %{col}%,
              rowIdx: %{row::index}%,
              colIdx: %{col::index}%,
              rowTotal: %{row::length}%,
              colTotal: %{col::length}%
            }
          }]
        }]
      }`,
      {
        rows: [
          { cells: ['a', 'b'] },
          { cells: ['c', 'd', 'e'] },
        ],
      },
    ) as any;
    expect(result.grid[0][0]).toEqual({ value: 'a', rowIdx: 0, colIdx: 0, rowTotal: 2, colTotal: 2 });
    expect(result.grid[0][1]).toEqual({ value: 'b', rowIdx: 0, colIdx: 1, rowTotal: 2, colTotal: 2 });
    expect(result.grid[1][2]).toEqual({ value: 'e', rowIdx: 1, colIdx: 2, rowTotal: 2, colTotal: 3 });
  });

  it('if as object property value drops property when skipped', () => {
    const result = decode(
      '{ fontSize: 12, optional: if(%{var:show}%) { "visible" } }',
      { show: false },
    ) as any;
    expect(result).toEqual({ fontSize: 12 });
    expect('optional' in result).toBe(false);
  });

  it('if as object property value keeps property when taken', () => {
    const result = decode(
      '{ fontSize: 12, optional: if(%{var:show}%) { "visible" } }',
      { show: true },
    ) as any;
    expect(result).toEqual({ fontSize: 12, optional: 'visible' });
  });

  it('throws if iterable is not an array', () => {
    expect(() =>
      decode('{ x: for(n in %{var:bad}%) { %{n}% } }', { bad: 42 }),
    ).toThrow();
  });
});
