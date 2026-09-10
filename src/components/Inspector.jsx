import './Inspector.css';

export default function Inspector({
  cursor,
  cols,
  rows,
  selectedPreset,
  selectedElement,
  onDeleteElement,
  historyLength,
  futureLength,
  isOpen,
  onClose,
}) {
  return (
    <aside className={`inspector${isOpen ? ' is-open' : ''}`}>
      <div className="inspector-header">
        <span className="inspector-label">Inspector</span>
      </div>

      <section className="inspector-section">
        <div className="inspector-section-title">Canvas</div>
        <div className="inspector-row">
          <span className="inspector-key">Col</span>
          <span className="inspector-value">{cursor.col}</span>
        </div>
        <div className="inspector-row">
          <span className="inspector-key">Row</span>
          <span className="inspector-value">{cursor.row}</span>
        </div>
        <div className="inspector-row">
          <span className="inspector-key">Size</span>
          <span className="inspector-value">{cols}×{rows}</span>
        </div>
        <div className="inspector-row">
          <span className="inspector-key">History</span>
          <span className="inspector-value">{historyLength}↩ {futureLength}↪</span>
        </div>
      </section>

      {selectedPreset && (
        <section className="inspector-section">
          <div className="inspector-section-title">Placing</div>
          <div className="inspector-row">
            <span className="inspector-key">Name</span>
            <span className="inspector-value inspector-value--green">{selectedPreset.label}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-key">Size</span>
            <span className="inspector-value">{selectedPreset.width}×{selectedPreset.height}</span>
          </div>
          <div className="inspector-preview">
            {selectedPreset.template.map((line, i) => (
              <div key={i} className="inspector-preview-line">{line}</div>
            ))}
          </div>
          <div className="inspector-hint">Click canvas to place</div>
        </section>
      )}

      {selectedElement && (
        <section className="inspector-section">
          <div className="inspector-section-title">Selected</div>
          <div className="inspector-row">
            <span className="inspector-key">Name</span>
            <span className="inspector-value inspector-value--green">{selectedElement.label}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-key">Position</span>
            <span className="inspector-value">{selectedElement.col}, {selectedElement.row}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-key">Size</span>
            <span className="inspector-value">{selectedElement.width}×{selectedElement.height}</span>
          </div>
          <button
            className="btn"
            onClick={() => onDeleteElement(selectedElement.id)}
          >
            Delete
          </button>
          <div className="inspector-hint">Drag to move · Delete/Backspace to remove</div>
        </section>
      )}
    </aside>
  );
}
