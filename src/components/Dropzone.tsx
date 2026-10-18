import { useState } from 'react';
import { Plus, Combine, ArrowUpRight } from 'lucide-react';
import type { MergeSession } from '../hooks/usePdfMerge';
export function Dropzone({ s }: { s: MergeSession }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void s.ingest(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="paper-art" aria-hidden="true">
        <div className="paper back" />
        <div className="paper front">
          <span>PDF</span>
          <i />
          <i />
          <i />
          <div>
            <Combine size={25} />
          </div>
        </div>
        <span className="art-star">✦</span>
      </div>
      <h2>Bring your PDFs together.</h2>
      <p>Drag & drop PDFs here</p>
      <button
        className="button primary browse-button"
        disabled={s.busy}
        onClick={s.browse}
      >
        <Plus size={18} />
        Choose PDF files
      </button>
      <span className="drop-hint">
        Up to 20 PDFs · 100 MB each · nothing uploaded
      </span>
      <div className="sample-divider">
        <span />
        JUST EXPLORING?
        <span />
      </div>
      <button className="sample-button" disabled={s.busy} onClick={s.samples}>
        Try sample PDFs
        <ArrowUpRight size={15} />
      </button>
      <span className="sample-hint">
        3 original documents. 8 pages of possibility.
      </span>
    </div>
  );
}
