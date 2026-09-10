import { useReducer, useCallback, useState, useEffect } from 'react';
import './App.css';
import Toolbar from './components/Toolbar.jsx';
import Canvas from './components/Canvas.jsx';
import Inspector from './components/Inspector.jsx';
import {
  createState, undo, redo, pushHistory, gridToText,
  createElement, renderElements, moveElement, deleteElement,
} from './lib/engine.js';
import { useWebMCP } from './lib/webmcp.js';

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_PRESET':
      return { ...state, selectedPreset: action.preset };

    case 'PLACE_COMPONENT': {
      const { preset, col, row } = action;
      const withHistory = pushHistory(state);
      const elements = [...withHistory.elements, createElement(preset, col, row)];
      return {
        ...withHistory,
        elements,
        grid: renderElements(elements, state.cols, state.rows),
        selectedPreset: null,
        selectedId: null,
      };
    }

    case 'SELECT_ELEMENT':
      return { ...state, selectedId: action.id, selectedPreset: null };

    case 'MOVE_ELEMENT': {
      const { id, col, row } = action;
      const withHistory = pushHistory(state);
      const elements = moveElement(withHistory.elements, id, col, row);
      return { ...withHistory, elements, grid: renderElements(elements, state.cols, state.rows) };
    }

    case 'DELETE_ELEMENT': {
      const withHistory = pushHistory(state);
      const elements = deleteElement(withHistory.elements, action.id);
      return {
        ...withHistory,
        elements,
        grid: renderElements(elements, state.cols, state.rows),
        selectedId: null,
      };
    }

    case 'SET_CURSOR':
      return { ...state, cursor: { col: action.col, row: action.row } };

    case 'UNDO':
      return undo(state);

    case 'REDO':
      return redo(state);

    case 'CLEAR': {
      const withHistory = pushHistory(state);
      return { ...withHistory, elements: [], grid: createState(withHistory.cols, withHistory.rows).grid, selectedId: null };
    }

    case 'SET_GRID': {
      const withHistory = pushHistory(state);
      return { ...withHistory, grid: action.grid, elements: [], selectedId: null };
    }

    default:
      return state;
  }
}

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 7L5 4.5M2.5 7L5 9.5M2.5 7H9a4 4 0 0 1 0 8H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 7L11 4.5M13.5 7L11 9.5M13.5 7H7a4 4 0 0 0 0 8H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="8" y1="0.5" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="13.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="0.5" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="13.5" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2.55" y1="2.55" x2="3.96" y2="3.96" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12.04" y1="12.04" x2="13.45" y2="13.45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2.55" y1="13.45" x2="3.96" y2="12.04" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12.04" y1="3.96" x2="13.45" y2="2.55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createState());
  const [mobileSheet, setMobileSheet] = useState(null); // null | 'components' | 'inspector' | 'more'
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('wiretext-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('wiretext-tour-seen'));
  const dismissTour = useCallback(() => {
    localStorage.setItem('wiretext-tour-seen', '1');
    setShowTour(false);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('wiretext-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSelectPreset = useCallback((preset) => {
    dispatch({ type: 'SELECT_PRESET', preset });
    setMobileSheet(null);
  }, []);

  const handlePlaceComponent = useCallback((preset, col, row) => {
    dispatch({ type: 'PLACE_COMPONENT', preset, col, row });
  }, []);

  const handleCursorMove = useCallback((col, row) => {
    dispatch({ type: 'SET_CURSOR', col, row });
  }, []);

  useWebMCP({ state, dispatch });

  const handleSelectElement = useCallback((id) => dispatch({ type: 'SELECT_ELEMENT', id }), []);
  const handleMoveElement = useCallback((id, col, row) => dispatch({ type: 'MOVE_ELEMENT', id, col, row }), []);
  const handleDeleteElement = useCallback((id) => dispatch({ type: 'DELETE_ELEMENT', id }), []);

  const handleUndo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const handleRedo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const handleClear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const handleExport = useCallback(() => {
    const text = gridToText(state.grid);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wireframe.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.grid]);

  const handleExportPng = useCallback(() => {
    const FONT_SIZE = 14;
    const LINE_HEIGHT = 20;
    const FONT_FAMILY = "'Berkeley Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace";
    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');
    mctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    const charW = mctx.measureText('M').width;

    const cols = state.cols;
    const rows = state.rows;
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.ceil(cols * charW);
    offscreen.height = rows * LINE_HEIGHT;
    const ctx = offscreen.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#000000';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = state.grid[r][c];
        if (ch !== ' ') ctx.fillText(ch, c * charW, r * LINE_HEIGHT + FONT_SIZE);
      }
    }

    const a = document.createElement('a');
    a.href = offscreen.toDataURL('image/png');
    a.download = 'wireframe.png';
    a.click();
  }, [state.grid, state.cols, state.rows]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(gridToText(state.grid)).catch(() => {});
  }, [state.grid]);

  const closeSheet = useCallback(() => setMobileSheet(null), []);

  const toggleSheet = useCallback((name) => {
    setMobileSheet(s => s === name ? null : name);
  }, []);

  return (
    <div className="app">
      {showTour && (
        <div className="tour-overlay" onClick={dismissTour}>
          <div className="tour-card" onClick={(e) => e.stopPropagation()}>
            <h2>Welcome to Formwork</h2>
            <ol>
              <li>Pick a component from the palette on the left.</li>
              <li>Click anywhere on the canvas to stamp it — hover shows a preview.</li>
              <li>Undo/Redo with Ctrl+Z / Ctrl+Y, Clear to start over.</li>
              <li>Export your wireframe as plain text or PNG from the header.</li>
            </ol>
            <button className="btn btn-primary" onClick={dismissTour}>Start drawing</button>
          </div>
        </div>
      )}
      <header className="app-header">
        <span className="app-title">Formwork</span>

        {/* Desktop header */}
        <div className="app-header-actions header-desktop">
          <button className="btn" onClick={handleUndo} title="Undo (Ctrl+Z)">Undo</button>
          <button className="btn" onClick={handleRedo} title="Redo (Ctrl+Y)">Redo</button>
          <button className="btn" onClick={handleClear}>Clear</button>
          <button className="btn" onClick={handleCopy}>Copy</button>
          <button className="btn" onClick={handleExport}>Export .txt</button>
          <button className="btn" onClick={handleExportPng}>Export PNG</button>
          <button className="btn btn-icon-round" onClick={() => setDarkMode(d => !d)} title="Toggle dark mode">
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Mobile header — icons only */}
        <div className="app-header-actions header-mobile">
          <button className="btn btn-icon-round" onClick={handleUndo} title="Undo"><UndoIcon /></button>
          <button className="btn btn-icon-round" onClick={handleRedo} title="Redo"><RedoIcon /></button>
          <button className="btn btn-icon-round" onClick={() => setDarkMode(d => !d)} title="Toggle dark mode">
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <Toolbar
        selectedPreset={state.selectedPreset}
        onSelectPreset={handleSelectPreset}
        isOpen={mobileSheet === 'components'}
      />

      <Canvas
        grid={state.grid}
        cols={state.cols}
        rows={state.rows}
        cursor={state.cursor}
        selectedPreset={state.selectedPreset}
        elements={state.elements}
        selectedId={state.selectedId}
        darkMode={darkMode}
        onPlaceComponent={handlePlaceComponent}
        onCursorMove={handleCursorMove}
        onSelectElement={handleSelectElement}
        onMoveElement={handleMoveElement}
        onDeleteElement={handleDeleteElement}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <Inspector
        cursor={state.cursor}
        cols={state.cols}
        rows={state.rows}
        selectedPreset={state.selectedPreset}
        selectedElement={state.elements.find(el => el.id === state.selectedId) || null}
        onDeleteElement={handleDeleteElement}
        historyLength={state.history.length}
        futureLength={state.future.length}
        isOpen={mobileSheet === 'inspector'}
        onClose={closeSheet}
      />

      {/* Mobile bottom bar */}
      <nav className="mobile-bar">
        <button className="mobile-bar-btn" onClick={handleUndo}>
          <UndoIcon />
          <span>Undo</span>
        </button>
        <button className="mobile-bar-btn" onClick={handleRedo}>
          <RedoIcon />
          <span>Redo</span>
        </button>
        <button
          className={`mobile-bar-btn mobile-bar-btn--add${mobileSheet === 'components' ? ' is-active' : ''}`}
          onClick={() => toggleSheet('components')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Add</span>
        </button>
        <button
          className={`mobile-bar-btn${mobileSheet === 'inspector' ? ' is-active' : ''}`}
          onClick={() => toggleSheet('inspector')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="9" y1="8.5" x2="9" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="5.5" r="0.9" fill="currentColor"/>
          </svg>
          <span>Info</span>
        </button>
        <button
          className={`mobile-bar-btn${mobileSheet === 'more' ? ' is-active' : ''}`}
          onClick={() => toggleSheet('more')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="4" cy="9" r="1.3" fill="currentColor"/>
            <circle cx="9" cy="9" r="1.3" fill="currentColor"/>
            <circle cx="14" cy="9" r="1.3" fill="currentColor"/>
          </svg>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile more sheet */}
      {mobileSheet === 'more' && (
        <div className="mobile-more-sheet">
          <button className="mobile-action-item" onClick={() => { handleClear(); closeSheet(); }}>
            Clear Canvas
          </button>
          <button className="mobile-action-item" onClick={() => { handleCopy(); closeSheet(); }}>
            Copy to Clipboard
          </button>
          <button className="mobile-action-item" onClick={() => { handleExport(); closeSheet(); }}>
            Export .txt
          </button>
          <button className="mobile-action-item" onClick={() => { handleExportPng(); closeSheet(); }}>
            Export PNG
          </button>
        </div>
      )}

      {/* Backdrop for any open sheet */}
      {mobileSheet && (
        <div className="mobile-backdrop" onClick={closeSheet} />
      )}
    </div>
  );
}
