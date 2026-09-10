# Blockframe API

Blockframe has two agent-facing interfaces, and they are not the same shape:

- **WebMCP**, in the browser, driving the live canvas. Stateful — it has `undo`.
- **HTTP**, on the deployed site: a REST API and a server MCP endpoint. Stateless
  transforms — a wireframe goes in, a wireframe comes out.

The split is deliberate. Keeping the server side stateless is what lets it run with no
database, no session store and no Durable Object.

Both HTTP surfaces call one shared definition in `src/lib/tools.js`, so they cannot
describe different behaviour. Add a tool there, not in either handler.

## HTTP

Served by Cloudflare Pages Functions from `functions/`. No auth, no writes to anything —
every response is a pure function of the request.

### REST

| Route | Body / query | Returns |
|---|---|---|
| `GET /api/components` | `?category=` optional | The 23 presets, their templates and sizes, plus every category |
| `POST /api/place` | `{ text?, componentId, col, row, cols?, rows? }` | `{ text, cols, rows, placed }` |
| `POST /api/render` | `{ text, cols?, rows? }` | `{ text, cols, rows }` — pads, clips, normalizes |
| `GET /api` | — | The endpoint list |

`place_component` is stateless, so chain calls by feeding the returned `text` back in as
the next request's `text`. Omit `text` to start from a blank grid. Placement that falls
off the grid is clipped, not an error; bad input (unknown `componentId`, a non-integer
`col`, text over 200,000 characters) is a `400` naming the problem.

```bash
curl -sX POST https://blockframe.heyitsmejosh.com/api/place \
  -H 'content-type: application/json' \
  -d '{"componentId":"button","col":2,"row":1,"cols":12,"rows":3}'
```

### MCP

`POST /mcp` — JSON-RPC, stateless streamable HTTP. No SDK and no Durable Object; the
transport is ported from `sidewise/src/mcp.js`. Tools: `list_components`,
`place_component`, `render_wireframe` — the same three the REST routes expose.

```bash
curl -sX POST https://blockframe.heyitsmejosh.com/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Note the difference from WebMCP below: there is no `undo` over HTTP, because there is no
server-side canvas to undo. The caller holds the state.

## WebMCP (browser only)

With the app open, Blockframe registers tools on `document.modelContext`.
Source: `src/lib/webmcp.js`.

### Read-only

| Tool | Does |
|---|---|
| `get_wireframe` | The current wireframe as ASCII text |
| `list_components` | Placeable components and their categories; filter with `category` |

### Reversible writes

| Tool | Does |
|---|---|
| `place_component` | Stamp a component at `col`/`row` (0-based, from top left) |
| `set_wireframe` | Replace the whole wireframe with ASCII `text` |
| `clear_wireframe` | Erase the canvas |
| `undo` / `redo` | Step the history |

Every write goes through the same reducer the toolbar uses, so `undo` reverses
anything an agent did. Nothing is persisted server-side, so no tool requires
confirmation.
