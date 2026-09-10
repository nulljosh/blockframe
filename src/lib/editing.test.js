import { describe, it, expect } from 'vitest';
import { resizeTemplate, updateElement, createState, pushHistory, undo, redo, renderElements } from './engine.js';

describe('element editing', () => {
  it('expands and contracts a box while preserving corners and text', () => {
    const art=['┌───┐','│Hi │','└───┘'];
    expect(resizeTemplate(art,7,4)).toEqual(['┌─────┐','│Hi   │','│     │','└─────┘']);
    expect(resizeTemplate(art,3,3)).toEqual(['┌─┐','│H│','└─┘']);
    expect(art[0]).toBe('┌───┐');
  });
  it('retains bracket endings and measures Unicode edits by characters', () => {
    expect(resizeTemplate(['[ OK ]'],9,1)).toEqual(['[ OK    ]']);
    const edited=updateElement([{id:'a',template:['old']}],'a',{text:'𝄞X\r\ny'});
    expect(edited[0]).toMatchObject({template:['𝄞X','y'],width:2,height:2});
  });
  it('undo and redo restore edited elements and overlapping content', () => {
    let state=createState(10,5);
    state.elements=[{id:'a',col:0,row:0,width:3,height:1,template:['ABC']},{id:'b',col:1,row:0,width:1,height:1,template:['Z']}];
    state={...pushHistory(state),elements:updateElement(state.elements,'b',{text:'XY'})};
    state.grid=renderElements(state.elements,10,5);
    expect(state.grid[0].slice(0,3).join('')).toBe('AXY');
    expect(undo(state).grid[0].slice(0,3).join('')).toBe('AZC');
    expect(redo(undo(state)).grid).toEqual(state.grid);
  });
});
