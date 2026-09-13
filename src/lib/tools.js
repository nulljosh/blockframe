// The one definition of what Block Frame can do over the network. Both surfaces — the REST
// routes in functions/api/ and the MCP server in functions/mcp.js — call `callTool` from
// here, so they cannot drift apart.
//
// Deliberately different from src/lib/webmcp.js: those tools are STATEFUL (undo, redo,
// clear all mutate the live canvas in the browser). These are transforms — a wireframe
// goes in, a wireframe comes out. That is what keeps this free of a database, a session
// store and a Durable Object.

import {
  DEFAULT_COLS, DEFAULT_ROWS, createGrid, gridToText, textToGrid, stampComponent,
} from './engine.js';
import { PRESETS, CATEGORIES, getPreset } from './presets.js';

// A 100x50 grid of astral-plane characters is ~40KB; 200KB is generous and still bounded.
export const MAX_TEXT = 200_000;
const MAX_COLS = 500;
const MAX_ROWS = 500;

class ToolError extends Error {}

const int = (v, name, { min, max, fallback }) => {
  if (v === undefined || v === null) {
    if (fallback !== undefined) return fallback;
    throw new ToolError(`${name} is required`);
  }
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n)) throw new ToolError(`${name} must be a whole number, got ${JSON.stringify(v)}`);
  if (n < min || n > max) throw new ToolError(`${name} must be between ${min} and ${max}, got ${n}`);
  return n;
};

const text = (v) => {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw new ToolError('text must be a string');
  // stampComponent indexes a grid sized from this, so an unbounded string is an
  // unbounded allocation on a public endpoint.
  if (v.length > MAX_TEXT) throw new ToolError(`text exceeds ${MAX_TEXT} characters`);
  return v;
};

const dimensions = (args) => ({
  cols: int(args.cols, 'cols', { min: 1, max: MAX_COLS, fallback: DEFAULT_COLS }),
  rows: int(args.rows, 'rows', { min: 1, max: MAX_ROWS, fallback: DEFAULT_ROWS }),
});

const componentSchema = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'The wireframe to modify, as ASCII/Unicode text. Omit for a blank grid.' },
    componentId: { type: 'string', description: 'Component id from list_components.' },
    col: { type: 'integer', description: 'Column to place at, 0-based from the left.' },
    row: { type: 'integer', description: 'Row to place at, 0-based from the top.' },
    cols: { type: 'integer', description: `Grid width. Default ${DEFAULT_COLS}.` },
    rows: { type: 'integer', description: `Grid height. Default ${DEFAULT_ROWS}.` },
  },
  required: ['componentId', 'col', 'row'],
};

export const TOOLS = [
  {
    name: 'list_components',
    description:
      `The ${PRESETS.length} wireframe components available to place, each with the Unicode box-drawing ` +
      'template it stamps and its size in character cells. Call this before place_component to get valid ids.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: CATEGORIES, description: 'Restrict to one category.' },
      },
    },
  },
  {
    name: 'place_component',
    description:
      'Stamp a component onto a wireframe at a grid position and return the result. Stateless: pass the ' +
      'current wireframe in as `text` and use the returned `text` as the input to the next call. ' +
      'Anything falling outside the grid is clipped, not an error.',
    inputSchema: componentSchema,
  },
  {
    name: 'render_wireframe',
    description:
      'Normalize arbitrary text onto the character grid — pads short lines, clips overflow, and returns ' +
      'the exact text the editor would show. Use it to check a hand-written wireframe before placing onto it.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'ASCII/Unicode wireframe, one line per row.' },
        cols: { type: 'integer', description: `Grid width. Default ${DEFAULT_COLS}.` },
        rows: { type: 'integer', description: `Grid height. Default ${DEFAULT_ROWS}.` },
      },
      required: ['text'],
    },
  },
];

export const TOOL_NAMES = TOOLS.map(t => t.name);

/// Runs one tool. Throws ToolError for bad input — callers turn that into a 400 or an MCP
/// isError result. Returns null for an unknown tool name so callers can 404 it.
export function callTool(name, rawArgs) {
  const args = rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs) ? rawArgs : {};

  switch (name) {
    case 'list_components': {
      const { category } = args;
      if (category !== undefined && !CATEGORIES.includes(category)) {
        throw new ToolError(`Unknown category: ${category}. One of: ${CATEGORIES.join(', ')}`);
      }
      const components = category ? PRESETS.filter(p => p.category === category) : PRESETS;
      return { categories: CATEGORIES, count: components.length, components };
    }

    case 'place_component': {
      const { cols, rows } = dimensions(args);
      const preset = getPreset(args.componentId);
      if (!preset) {
        throw new ToolError(
          `Unknown componentId: ${JSON.stringify(args.componentId)}. Call list_components for valid ids.`,
        );
      }
      // Off-grid placement clips rather than throwing (stampComponent already skips
      // out-of-range cells), but a wildly out-of-range coordinate is a caller bug worth
      // naming rather than silently returning an unchanged wireframe.
      const col = int(args.col, 'col', { min: -MAX_COLS, max: MAX_COLS });
      const row = int(args.row, 'row', { min: -MAX_ROWS, max: MAX_ROWS });
      const grid = args.text ? textToGrid(text(args.text), cols, rows) : createGrid(cols, rows);
      return {
        text: gridToText(stampComponent(grid, preset.template, col, row)),
        cols,
        rows,
        placed: { id: preset.id, label: preset.label, col, row, width: preset.width, height: preset.height },
      };
    }

    case 'render_wireframe': {
      const { cols, rows } = dimensions(args);
      return { text: gridToText(textToGrid(text(args.text), cols, rows)), cols, rows };
    }

    default:
      return null;
  }
}

export { ToolError };
