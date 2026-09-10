import { describe, it, expect } from 'vitest';
import {
  createGrid, cloneGrid, gridToText, textToGrid,
  stampComponent, setChar, eraseRegion, pxToCell, renderElements,
  createState, pushHistory, undo, redo,
  DEFAULT_COLS, DEFAULT_ROWS,
} from './engine.js';

describe('createGrid', () => {
  it('creates a grid with correct dimensions', () => {
    const g = createGrid(5, 3);
    expect(g.length).toBe(3);
    expect(g[0].length).toBe(5);
  });

  it('fills with spaces', () => {
    const g = createGrid(4, 2);
    g.forEach(row => row.forEach(c => expect(c).toBe(' ')));
  });

  it('uses default dimensions', () => {
    const g = createGrid();
    expect(g.length).toBe(DEFAULT_ROWS);
    expect(g[0].length).toBe(DEFAULT_COLS);
  });
});

describe('cloneGrid', () => {
  it('produces a deep copy', () => {
    const g = createGrid(3, 2);
    const clone = cloneGrid(g);
    clone[0][0] = 'X';
    expect(g[0][0]).toBe(' ');
  });
});

describe('gridToText / textToGrid', () => {
  it('round-trips a simple grid', () => {
    const original = createGrid(5, 3);
    original[0][0] = 'H';
    original[1][2] = 'i';
    const text = gridToText(original);
    const restored = textToGrid(text, 5, 3);
    expect(restored[0][0]).toBe('H');
    expect(restored[1][2]).toBe('i');
  });

  it('gridToText joins rows with newlines', () => {
    const g = createGrid(3, 2);
    g[0][0] = 'A';
    g[1][1] = 'B';
    const text = gridToText(g);
    expect(text.split('\n').length).toBe(2);
  });
});

describe('stampComponent', () => {
  it('stamps a template at the correct position', () => {
    const g = createGrid(10, 5);
    const next = stampComponent(g, ['AB', 'CD'], 2, 1);
    expect(next[1][2]).toBe('A');
    expect(next[1][3]).toBe('B');
    expect(next[2][2]).toBe('C');
    expect(next[2][3]).toBe('D');
  });

  it('does not mutate original grid', () => {
    const g = createGrid(5, 5);
    stampComponent(g, ['X'], 0, 0);
    expect(g[0][0]).toBe(' ');
  });

  it('clips when stamp goes out of bounds', () => {
    const g = createGrid(3, 3);
    expect(() => stampComponent(g, ['ABCD'], 2, 0)).not.toThrow();
  });
});

describe('setChar', () => {
  it('sets a character at a position', () => {
    const g = createGrid(5, 5);
    const next = setChar(g, 2, 3, '#');
    expect(next[3][2]).toBe('#');
  });

  it('returns original grid for out-of-bounds', () => {
    const g = createGrid(5, 5);
    const next = setChar(g, -1, 0, '#');
    expect(next).toBe(g);
  });

  it('uses space for falsy char', () => {
    const g = createGrid(3, 3);
    const filled = setChar(g, 1, 1, '*');
    const erased = setChar(filled, 1, 1, '');
    expect(erased[1][1]).toBe(' ');
  });
});

describe('eraseRegion', () => {
  it('erases a rectangular region', () => {
    const g = createGrid(10, 10);
    let next = setChar(g, 2, 2, 'X');
    next = setChar(next, 3, 3, 'Y');
    next = eraseRegion(next, 2, 2, 2, 2);
    expect(next[2][2]).toBe(' ');
    expect(next[3][3]).toBe(' ');
  });
});

describe('pxToCell', () => {
  it('converts pixel coords to cell', () => {
    const result = pxToCell(30, 48, 10, 16);
    expect(result.col).toBe(3);
    expect(result.row).toBe(3);
  });

  it('floors fractional results', () => {
    const result = pxToCell(9, 15, 10, 16);
    expect(result.col).toBe(0);
    expect(result.row).toBe(0);
  });
});

describe('undo / redo', () => {
  it('undo returns state unchanged when history is empty', () => {
    const s = createState(5, 5);
    expect(undo(s)).toBe(s);
  });

  it('redo returns state unchanged when future is empty', () => {
    const s = createState(5, 5);
    expect(redo(s)).toBe(s);
  });

  it('undo reverts to previous grid state', () => {
    let s = createState(5, 5);
    s = pushHistory(s);
    s = { ...s, elements: [{ id: 'e1', template: ['Z'], width: 1, height: 1, col: 0, row: 0 }] };
    s = { ...s, grid: renderElements(s.elements, s.cols, s.rows) };
    const reverted = undo(s);
    expect(reverted.grid[0][0]).toBe(' ');
  });

  it('redo reapplies undone change', () => {
    let s = createState(5, 5);
    s = pushHistory(s);
    s = { ...s, elements: [{ id: 'e1', template: ['Z'], width: 1, height: 1, col: 0, row: 0 }] };
    s = { ...s, grid: renderElements(s.elements, s.cols, s.rows) };
    s = undo(s);
    s = redo(s);
    expect(s.grid[0][0]).toBe('Z');
  });
});
