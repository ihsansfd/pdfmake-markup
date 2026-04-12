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

  it('evaluates literal expressions', () => {
    const result = decode('{ size: %{10 * 2}% }') as any;
    expect(result).toEqual({ size: 20 });
  });

  it('evaluates ternary expressions', () => {
    const result = decode('{ val: %{10 > 5 ? 1 : 0}% }') as any;
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
        {
          left: %{currentPage == 1 ? 80 : 40}%,
          top: 40,
          right: %{currentPage == 1 ? 40 : 80}%,
          bottom: 40
        }
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

  it('decodes a pdfmake-like document', () => {
    const result = decode(`{
      content: [
        { text: "Invoice", bold: true, fontSize: 18 },
        "Some plain text",
        {
          table: {
            headerRows: 1,
            widths: [100, '*', 80],
            body: [
              ["Item", "Desc", "Price"],
              ["Gadget", "Widget", 10]
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
    }`) as any;

    expect(result.content[0]).toEqual({ text: 'Invoice', bold: true, fontSize: 18 });
    expect(result.content[1]).toBe('Some plain text');
    expect(result.content[2].table.body[1][0]).toBe('Gadget');
    expect(typeof result.content[2].layout.hLineWidth).toBe('function');
    expect(result.content[2].layout.hLineWidth(0)).toBe(2);
    expect(result.content[2].layout.hLineWidth(1)).toBe(1);
    expect(result.styles).toEqual({ header: { fontSize: 18, bold: true } });
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

  it('spreads map result inside an array', () => {
    const result = decode(
      '{ content: [...map(item in %{[{name:"a"},{name:"b"},{name:"c"}]}%) { { text: %{item.name}% } }] }',
    ) as any;
    expect(result.content).toEqual([
      { text: 'a' },
      { text: 'b' },
      { text: 'c' },
    ]);
  });

  it('uses name::index for first/last detection', () => {
    const result = decode(
      '{ items: [...map(r in %{["a","b","c"]}%) { { text: %{r}%, isFirst: %{r::index == 0}%, isLast: %{r::index == r::length - 1}% } }] }',
    ) as any;
    expect(result.items[0]).toMatchObject({ isFirst: true, isLast: false });
    expect(result.items[1]).toMatchObject({ isFirst: false, isLast: false });
    expect(result.items[2]).toMatchObject({ isFirst: false, isLast: true });
  });

  it('map as top-level value', () => {
    const result = decode('map(n in %{[1,2,3]}%) { %{n * 2}% }') as any;
    expect(result).toEqual([2, 4, 6]);
  });

  it('map spread with explicit object body', () => {
    const result = decode(
      '{ rows: [...map(row in %{["a","b"]}%) { { text: %{row}%, bold: true } }] }',
    ) as any;
    expect(result.rows).toEqual([
      { text: 'a', bold: true },
      { text: 'b', bold: true },
    ]);
  });

  it('if with true condition picks then branch', () => {
    const result = decode(
      '{ content: [{ text: "header" }, if(%{true}%) { { text: "inner" } }] }',
    ) as any;
    expect(result.content).toEqual([{ text: 'header' }, { text: 'inner' }]);
  });

  it('if with false condition and no else is skipped in array', () => {
    const result = decode(
      '{ content: [{ text: "a" }, if(%{false}%) { { text: "b" } }, { text: "c" }] }',
    ) as any;
    expect(result.content).toEqual([{ text: 'a' }, { text: 'c' }]);
  });

  it('if with else branch', () => {
    const result = decode(
      '{ content: [if(%{false}%) { { text: "Gold" } } else { { text: "Free" } }] }',
    ) as any;
    expect(result.content).toEqual([{ text: 'Free' }]);
  });

  it('if with else if chain', () => {
    const build = (tier: string) => `{
      pick: given(tier) {
        [
          if(%{tier == "a"}%) { { text: "A" } }
          else if(%{tier == "b"}%) { { text: "B" } }
          else { { text: "other" } }
        ]
      }
    }`;
    const result = decode(build('x')) as any;
    expect(result.pick('a')).toEqual([{ text: 'A' }]);
    expect(result.pick('b')).toEqual([{ text: 'B' }]);
    expect(result.pick('c')).toEqual([{ text: 'other' }]);
  });

  it('nested maps', () => {
    const result = decode(
      '{ grid: [...map(row in %{[[1,2],[3,4]]}%) { [...map(col in %{row}%) { %{col}% }] }] }',
    ) as any;
    expect(result.grid).toEqual([[1, 2], [3, 4]]);
  });

  it('map + if combined', () => {
    const result = decode(
      '{ items: [...map(n in %{[1,2,3,4,5]}%) { if(%{n > 2}%) { %{n}% } }] }',
    ) as any;
    expect(result.items).toEqual([3, 4, 5]);
  });

  it('map inside given body uses argument as iterable', () => {
    const result = decode(
      '{ fn: given(rows) { [...map(r in %{rows}%) { %{r * 10}% }] } }',
    ) as any;
    expect(result.fn([1, 2, 3])).toEqual([10, 20, 30]);
  });

  it('loop-scoped meta via name::index and name::length', () => {
    const result = decode(
      '{ items: [...map(row in %{["a","b","c"]}%) { { n: %{row}%, idx: %{row::index}%, total: %{row::length}% } }] }',
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
        grid: [...map(row in %{[{cells:["a","b"]},{cells:["c","d","e"]}]}%) {
          [...map(col in %{row.cells}%) {
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
    ) as any;
    expect(result.grid[0][0]).toEqual({ value: 'a', rowIdx: 0, colIdx: 0, rowTotal: 2, colTotal: 2 });
    expect(result.grid[0][1]).toEqual({ value: 'b', rowIdx: 0, colIdx: 1, rowTotal: 2, colTotal: 2 });
    expect(result.grid[1][2]).toEqual({ value: 'e', rowIdx: 1, colIdx: 2, rowTotal: 2, colTotal: 3 });
  });

  it('if as object property value drops property when skipped', () => {
    const result = decode(
      '{ fontSize: 12, optional: if(%{false}%) { "visible" } }',
    ) as any;
    expect(result).toEqual({ fontSize: 12 });
    expect('optional' in result).toBe(false);
  });

  it('if as object property value keeps property when taken', () => {
    const result = decode(
      '{ fontSize: 12, optional: if(%{true}%) { "visible" } }',
    ) as any;
    expect(result).toEqual({ fontSize: 12, optional: 'visible' });
  });

  it('throws if iterable is not an array', () => {
    expect(() => decode('{ x: map(n in %{42}%) { %{n}% } }')).toThrow();
  });

  describe('return-value invariants', () => {
    it('given always returns a function', () => {
      expect(typeof (decode('{ f: given(x) { %{x}% } }') as any).f).toBe('function');
      expect(typeof (decode('{ f: given() { if(%{false}%) { 1 } } }') as any).f).toBe('function');
      expect(typeof (decode('{ f: given() { map(i in %{[1,2]}%) { %{i}% } } }') as any).f).toBe('function');
    });

    it('map always returns an array', () => {
      expect(Array.isArray(decode('map(i in %{[]}%) { %{i}% }'))).toBe(true);
      expect(Array.isArray(decode('map(i in %{[1,2,3]}%) { %{i}% }'))).toBe(true);
      expect(Array.isArray(decode('map(i in %{[1,2]}%) { if(%{false}%) { %{i}% } }'))).toBe(true);
    });

    it('if with false cond and no else returns undefined at top level (not IF_SKIP)', () => {
      const result = decode('if(%{false}%) { { text: "hi" } }');
      expect(result).toBeUndefined();
      expect(typeof result).toBe('undefined');
    });

    it('given body that skips via if returns undefined (not IF_SKIP)', () => {
      const result = decode('{ f: given(x) { if(%{x > 10}%) { %{x}% } } }') as any;
      expect(result.f(20)).toBe(20);
      expect(result.f(5)).toBeUndefined();
    });

    it('nested if where outer taken, inner skipped, inside object drops the property', () => {
      const result = decode(
        '{ a: 1, b: if(%{true}%) { if(%{false}%) { "x" } } }',
      ) as any;
      expect(result).toEqual({ a: 1 });
      expect('b' in result).toBe(false);
    });

    it('map body that always skips via if returns empty array', () => {
      const result = decode('map(i in %{[1,2,3]}%) { if(%{false}%) { %{i}% } }');
      expect(result).toEqual([]);
    });
  });
});
