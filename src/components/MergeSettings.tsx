import { Combine, ShieldCheck, FileCheck2 } from 'lucide-react';
import type { MergeSession } from '../hooks/usePdfMerge';
export function MergeSettings({ s }: { s: MergeSession }) {
  const count = s.session.pages.filter((p) => !p.removed).length;
  return (
    <aside className="settings">
      <span className="section-label">ONE GOOD DOCUMENT</span>
      <h2>Make it yours.</h2>
      <div className="output-tile">
        <FileCheck2 size={23} />
        <div>
          <strong>PDF document</strong>
          <small>Original pages. One file.</small>
        </div>
      </div>
      <label htmlFor="output-name">Output filename</label>
      <input
        id="output-name"
        value={s.name}
        maxLength={180}
        disabled={s.busy}
        onChange={(e) => s.setName(e.target.value)}
      />
      <p className="setting-note">
        We’ll add .pdf and clean up unsafe characters.
      </p>
      <div className="summary-count">
        <span>Documents</span>
        <strong>{s.session.documents.length}</strong>
        <span>Output pages</span>
        <strong>{count}</strong>
      </div>
      <p className="format-note">
        Pages are copied without intentionally rasterizing or recompressing
        their content. Text and vectors stay in PDF form.
      </p>
      <p className="setting-note">
        Interactive annotations, links, forms, bookmarks and signatures are not
        preserved. Merging signed PDFs invalidates signatures.
      </p>
      <div className="export-area">
        {s.progress && (
          <div className="progress" role="status">
            <p>{s.progress.stage}</p>
            <progress
              value={s.progress.completed}
              max={s.progress.total || 1}
              aria-label="Processing progress"
            />
          </div>
        )}
        <button
          className="button primary full"
          disabled={s.busy || !count}
          onClick={() => void s.merge()}
        >
          <Combine size={18} />
          Merge {count ? `${count} page${count === 1 ? '' : 's'}` : 'PDFs'}
        </button>
        {s.busy && (
          <button
            className="button secondary full cancel-button"
            onClick={s.cancel}
          >
            Cancel processing
          </button>
        )}
        <p className="export-caption">
          <ShieldCheck size={13} /> Files are processed locally in your browser.
        </p>
      </div>
    </aside>
  );
}
