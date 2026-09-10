import { useRef, useState } from 'react';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
export default function ElementOverlay({ element, charWidth, cols, rows, onUpdate, editing, onEdit }) {
  const drag = useRef(null);
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState(element.template.join('\n'));
  const box = preview || element;
  function move(e) {
    if (!drag.current) return;
    const {x, y, edge} = drag.current;
    const dx = Math.round((e.clientX - x) / charWidth), dy = Math.round((e.clientY - y) / 20);
    let left = element.col, top = element.row, right = left + element.width, bottom = top + element.height;
    if (edge.includes('w')) left = Math.max(0, Math.min(right - 2, left + dx));
    if (edge.includes('e')) right = Math.min(cols, Math.max(left + 2, right + dx));
    if (edge.includes('n')) top = Math.max(0, Math.min(bottom - 1, top + dy));
    if (edge.includes('s')) bottom = Math.min(rows, Math.max(top + 1, bottom + dy));
    drag.current.box = {col:left, row:top, width:right-left, height:bottom-top};
    setPreview(drag.current.box);
  }
  function finish() {
    const next = drag.current?.box;
    drag.current = null; setPreview(null);
    if (next && Object.keys(next).some(key => next[key] !== element[key])) onUpdate(element.id, next);
  }
  return <div className="element-overlay" style={{left:box.col*charWidth, top:box.row*20, width:box.width*charWidth, height:box.height*20}}>
    {!editing && <>
      {HANDLES.map(edge => <button key={edge} className={`resize-handle handle-${edge}`} aria-label={`Resize ${edge}`} style={{cursor:`${edge}-resize`}}
        onPointerDown={e => {e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); drag.current={x:e.clientX,y:e.clientY,edge};}}
        onPointerMove={move} onPointerUp={finish} onPointerCancel={() => {drag.current=null;setPreview(null);}} />)}
      <button className="element-edit btn" onClick={() => {setText(element.template.join('\n'));onEdit(true);}}>Edit text</button>
    </>}
    {editing && <form className="element-editor" onSubmit={e => {e.preventDefault();onUpdate(element.id,{text});onEdit(false);}}
      onKeyDown={e => {e.stopPropagation();if(e.key==='Escape'){e.preventDefault();onEdit(false);}if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();onUpdate(element.id,{text});onEdit(false);}}}>
      <textarea autoFocus aria-label="Element text" value={text} onChange={e=>setText(e.target.value)} spellCheck={false}/>
      <div><button className="btn" type="submit">Save</button><button className="btn" type="button" onClick={()=>onEdit(false)}>Cancel</button></div>
    </form>}
  </div>;
}
