// WebMCP tool registration. Exposes Block Frame's wireframe actions to in-browser
// agents via document.modelContext.
//
// ponytail: tools dispatch the same reducer actions the toolbar and canvas
// dispatch, so undo/redo covers anything an agent does.
import { useEffect, useRef } from 'react';
import { gridToText, textToGrid } from './engine.js';
import { PRESETS, CATEGORIES, getPreset } from './presets.js';

function buildTools(get) {
  return [
    // ---- read-only -------------------------------------------------------
    {
      name: 'get_wireframe',
      description: 'Get the current wireframe as ASCII text.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ text: gridToText(get().state.grid) }),
    },
    {
      name: 'list_components',
      description: 'List the wireframe components available to place, optionally filtered by category.',
      inputSchema: {
        type: 'object',
        properties: { category: { type: 'string', description: `One of: ${CATEGORIES.join(', ')}` } },
      },
      execute: async ({ category } = {}) => ({
        categories: CATEGORIES,
        components: PRESETS
          .filter(p => !category || p.category === category)
          .map(({ id, name, category }) => ({ id, name, category })),
      }),
    },

    // ---- reversible state changes ----------------------------------------
    {
      name: 'place_component',
      description: 'Stamp a component onto the wireframe at a grid position. Undoable.',
      inputSchema: {
        type: 'object',
        properties: {
          componentId: { type: 'string', description: 'Component id from list_components' },
          col: { type: 'number', description: 'Column, 0-based from the left' },
          row: { type: 'number', description: 'Row, 0-based from the top' },
        },
        required: ['componentId', 'col', 'row'],
      },
      execute: async ({ componentId, col, row }) => {
        const preset = getPreset(componentId);
        if (!preset) return { error: `No component with id "${componentId}"` };
        get().dispatch({ type: 'PLACE_COMPONENT', preset, col, row });
        return { placed: componentId, col, row };
      },
    },
    {
      name: 'set_wireframe',
      description: 'Replace the whole wireframe with ASCII text. Undoable.',
      inputSchema: {
        type: 'object',
        properties: { text: { type: 'string', description: 'ASCII wireframe, one line per row' } },
        required: ['text'],
      },
      execute: async ({ text }) => {
        const { state, dispatch } = get();
        dispatch({ type: 'SET_GRID', grid: textToGrid(text, state.cols, state.rows) });
        return { rows: text.split('\n').length };
      },
    },
    {
      name: 'clear_wireframe',
      description: 'Erase the wireframe. Undoable with undo.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => { get().dispatch({ type: 'CLEAR' }); return { cleared: true }; },
    },
    {
      name: 'undo',
      description: 'Undo the last wireframe change.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => { get().dispatch({ type: 'UNDO' }); return { ok: true }; },
    },
    {
      name: 'redo',
      description: 'Redo the last undone wireframe change.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => { get().dispatch({ type: 'REDO' }); return { ok: true }; },
    },
  ];
}

export function useWebMCP(ctx) {
  const ref = useRef(ctx);
  ref.current = ctx;

  useEffect(() => {
    const mc = document.modelContext;
    if (!mc?.registerTool) return; // browser without WebMCP support
    let cancelled = false;
    const registered = [];

    (async () => {
      for (const tool of buildTools(() => ref.current)) {
        if (cancelled) return;
        try {
          registered.push(await mc.registerTool(tool));
        } catch (err) {
          console.warn('[webmcp] failed to register', tool.name, err?.message);
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const h of registered) { try { h?.unregister?.(); } catch { /* gone already */ } }
    };
  }, []);
}
