import { useRef, useEffect, useCallback } from 'react';
import './Canvas.css';
import { pxToCell, stampComponent, elementAt } from '../lib/engine.js';

const FONT_SIZE = 14;
// ponytail: the canvas is a character grid, so monospace is correct here and
// only here — the surrounding UI is sans via --font-body. Read it off the
// shared tokens rather than naming fonts this repo does not ship.
const LINE_HEIGHT = 20;

function token(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
const FONT_FAMILY = () => token('--font-code', 'ui-monospace, monospace');

function measureCharWidth(fontSize, fontFamily) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText('M').width;
}

export default function Canvas({
  grid,
  cols,
  rows,
  cursor,
  selectedPreset,
  elements = [],
  selectedId = null,
  darkMode,
  onPlaceComponent,
  onCursorMove,
  onSelectElement,
  onMoveElement,
  onDeleteElement,
  onUndo,
  onRedo,
}) {
  const canvasRef = useRef(null);
  const charWRef = useRef(null);
  const hoverRef = useRef(null);
  const dragRef = useRef(null); // { id, startCol, startRow, offCol, offRow } while dragging

  const selectedEl = elements.find(el => el.id === selectedId) || null;

  function getCharW() {
    if (!charWRef.current) {
      charWRef.current = measureCharWidth(FONT_SIZE, FONT_FAMILY());
    }
    return charWRef.current;
  }

  const draw = useCallback((hoverCell) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const charW = getCharW();
    const charH = LINE_HEIGHT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = token('--color-bg2', '#faf8f3');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = token('--color-hairline', 'rgba(0,0,0,0.12)');
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        ctx.fillRect(Math.round(c * charW), r * charH, 1, 1);
      }
    }

    if (hoverCell && selectedPreset) {
      const { col, row } = hoverCell;
      const previewGrid = stampComponent(grid, selectedPreset.template, col, row);
      ctx.font = `${FONT_SIZE}px ${FONT_FAMILY()}`;
      ctx.fillStyle = token('--color-secondary', 'rgba(0,0,0,0.5)');
      for (let dy = 0; dy < selectedPreset.height; dy++) {
        const r = row + dy;
        if (r < 0 || r >= rows) continue;
        for (let dc = 0; dc < selectedPreset.width; dc++) {
          const c = col + dc;
          if (c < 0 || c >= cols) continue;
          ctx.fillText(previewGrid[r][c], c * charW, r * charH + FONT_SIZE);
        }
      }
    }

    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY()}`;
    ctx.fillStyle = token('--color-text', '#000000');
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = grid[r][c];
        if (ch !== ' ') {
          ctx.fillText(ch, c * charW, r * charH + FONT_SIZE);
        }
      }
    }

    // Selection box around the selected element (or its live drag position).
    if (selectedEl) {
      const drag = dragRef.current;
      const dcol = drag && drag.id === selectedEl.id ? drag.col : selectedEl.col;
      const drow = drag && drag.id === selectedEl.id ? drag.row : selectedEl.row;
      ctx.strokeStyle = token('--accent', '#ffca30');
      ctx.lineWidth = 2;
      ctx.strokeRect(
        dcol * charW - 1.5,
        drow * charH - 1.5,
        selectedEl.width * charW + 3,
        selectedEl.height * charH + 3,
      );
      // Redraw the element's own glyphs at the drag position so it visibly follows the cursor.
      if (drag && drag.id === selectedEl.id) {
        ctx.font = `${FONT_SIZE}px ${FONT_FAMILY()}`;
        ctx.fillStyle = token('--color-text', '#000000');
        for (let dy = 0; dy < selectedEl.template.length; dy++) {
          const chars = [...selectedEl.template[dy]];
          for (let dx = 0; dx < chars.length; dx++) {
            if (chars[dx] === ' ') continue;
            ctx.fillText(chars[dx], (dcol + dx) * charW, (drow + dy) * charH + FONT_SIZE);
          }
        }
      }
    }

    if (!selectedPreset) {
      const cx = cursor.col * charW;
      const cy = cursor.row * charH;
      ctx.strokeStyle = token('--color-hairline', 'rgba(0,0,0,0.3)');
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, cy + 0.5, charW - 1, charH - 1);
    }
  }, [grid, cols, rows, cursor, selectedPreset, selectedEl, darkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const charW = getCharW();
    const w = Math.ceil(cols * charW);
    const h = rows * LINE_HEIGHT;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    draw(hoverRef.current);
  }, [grid, cols, rows, cursor, selectedPreset, draw]);

  const getCellFromPoint = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const charW = getCharW();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    return pxToCell(px, py, charW, LINE_HEIGHT);
  }, []);

  const getCellFromEvent = useCallback((e) => {
    return getCellFromPoint(e.clientX, e.clientY);
  }, [getCellFromPoint]);

  const handleMouseMove = useCallback((e) => {
    const cell = getCellFromEvent(e);
    hoverRef.current = cell;
    onCursorMove(cell.col, cell.row);
    const drag = dragRef.current;
    if (drag) {
      drag.col = cell.col - drag.offCol;
      drag.row = cell.row - drag.offRow;
    }
    draw(cell);
  }, [getCellFromEvent, onCursorMove, draw]);

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = null;
    draw(null);
  }, [draw]);

  const handleMouseDown = useCallback((e) => {
    if (selectedPreset) return; // placing, not selecting/dragging
    const cell = getCellFromEvent(e);
    const el = elementAt(elements, cell.col, cell.row);
    if (el) {
      onSelectElement(el.id);
      dragRef.current = { id: el.id, offCol: cell.col - el.col, offRow: cell.row - el.row, col: el.col, row: el.row };
    } else {
      onSelectElement(null);
    }
  }, [selectedPreset, getCellFromEvent, elements, onSelectElement]);

  const handleMouseUp = useCallback(() => {
    const drag = dragRef.current;
    if (drag && (drag.col !== undefined)) {
      const el = elements.find(x => x.id === drag.id);
      if (el && (drag.col !== el.col || drag.row !== el.row)) {
        onMoveElement(drag.id, drag.col, drag.row);
      }
    }
    dragRef.current = null;
  }, [elements, onMoveElement]);

  const handleClick = useCallback((e) => {
    const cell = getCellFromEvent(e);
    onCursorMove(cell.col, cell.row);
    if (selectedPreset) {
      onPlaceComponent(selectedPreset, cell.col, cell.row);
    }
  }, [getCellFromEvent, selectedPreset, onPlaceComponent, onCursorMove]);

  const handleTouchEnd = useCallback((e) => {
    if (!selectedPreset) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    onCursorMove(cell.col, cell.row);
    onPlaceComponent(selectedPreset, cell.col, cell.row);
  }, [selectedPreset, getCellFromPoint, onCursorMove, onPlaceComponent]);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      onUndo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      onRedo();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      onDeleteElement(selectedId);
    }
  }, [onUndo, onRedo, selectedId, onDeleteElement]);

  return (
    <div className="canvas-wrapper" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="canvas-scroll">
        <canvas
          ref={canvasRef}
          className={`canvas${selectedPreset ? ' canvas--place-mode' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
        />
      </div>
    </div>
  );
}
