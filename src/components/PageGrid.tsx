import {
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react';
import type { MergeSession } from '../hooks/usePdfMerge';
import { PageThumbnail } from './PageThumbnail';
export function PageGrid({
  s,
  offset,
  setOffset,
}: {
  s: MergeSession;
  offset: number;
  setOffset: (n: number) => void;
}) {
  const pages = s.session.pages.filter((p) => !p.removed);
  const start = Math.min(
    Math.floor(offset / 12) * 12,
    Math.max(0, Math.floor((pages.length - 1) / 12) * 12),
  );
  const selected = pages.filter((p) => p.selected).map((p) => p.id);
  const removed = s.session.pages.filter((p) => p.removed);
  return (
    <>
      <div className="selection-toolbar" aria-label="Page selection controls">
        <span>{selected.length} selected</span>
        <button disabled={s.busy} onClick={() => s.select('all')}>
          Select all
        </button>
        <button disabled={s.busy} onClick={() => s.select('none')}>
          Deselect all
        </button>
        <button disabled={s.busy} onClick={() => s.select('invert')}>
          Invert selection
        </button>
        <button
          disabled={s.busy || !selected.length}
          onClick={() => s.edit(selected, 'left')}
        >
          Rotate selected left
        </button>
        <button
          disabled={s.busy || !selected.length}
          onClick={() => s.edit(selected, 'right')}
        >
          Rotate selected right
        </button>
        <button
          disabled={s.busy || !selected.length}
          onClick={() => s.edit(selected, 'remove')}
        >
          Delete selected pages
        </button>
      </div>
      <p className="setting-note">
        Every included page is merged in this exact order. Checkboxes select
        pages for editing, not export.
      </p>
      <div className="page-grid" aria-label="Output pages in order">
        {pages.slice(start, start + 12).map((p, i) => {
          const index = start + i;
          const doc = s.session.documents.find((d) => d.id === p.documentId)!;
          const label = `${doc.file.name} page ${p.sourcePageIndex + 1}`;
          return (
            <article
              key={p.id}
              className={`page-card ${p.selected ? 'is-selected' : ''}`}
              data-page-label={label}
              draggable={!s.busy}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/pdfmerge-page', p.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('application/pdfmerge-page'))
                  e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('application/pdfmerge-page');
                if (id) s.movePage(id, index);
              }}
            >
              <label className="page-select">
                <input
                  type="checkbox"
                  checked={p.selected}
                  disabled={s.busy}
                  aria-label={`Select ${label}`}
                  onChange={() =>
                    s.updatePages(
                      s.session.pages.map((page) =>
                        page.id === p.id
                          ? { ...page, selected: !page.selected }
                          : page,
                      ),
                    )
                  }
                />
                <span>#{index + 1}</span>
              </label>
              <PageThumbnail
                doc={doc}
                index={p.sourcePageIndex}
                rotation={p.rotation}
              />
              <strong className="break-name">{doc.file.name}</strong>
              <small>
                Page {p.sourcePageIndex + 1} · +{p.rotation}°
              </small>
              <div className="page-controls">
                <button
                  className="icon-button"
                  aria-label={`Move ${label} to beginning`}
                  disabled={s.busy || index === 0}
                  onClick={() => s.movePage(p.id, 0)}
                >
                  <ChevronsLeft size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move ${label} left`}
                  disabled={s.busy || index === 0}
                  onClick={() => s.movePage(p.id, index - 1)}
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move ${label} right`}
                  disabled={s.busy || index === pages.length - 1}
                  onClick={() => s.movePage(p.id, index + 1)}
                >
                  <ArrowRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move ${label} to end`}
                  disabled={s.busy || index === pages.length - 1}
                  onClick={() => s.movePage(p.id, pages.length - 1)}
                >
                  <ChevronsRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Rotate ${label} left`}
                  disabled={s.busy}
                  onClick={() => s.edit([p.id], 'left')}
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Rotate ${label} right`}
                  disabled={s.busy}
                  onClick={() => s.edit([p.id], 'right')}
                >
                  <RotateCw size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${label}`}
                  disabled={s.busy}
                  onClick={() => s.edit([p.id], 'remove')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!pages.length && (
        <p className="empty-pages">
          All pages removed. Restore pages below to continue.
        </p>
      )}
      {pages.length > 12 && (
        <div className="pagination">
          <button
            className="button secondary"
            disabled={s.busy || start === 0}
            onClick={() => setOffset(start - 12)}
          >
            Previous pages
          </button>
          <span>
            {start + 1}–{Math.min(start + 12, pages.length)} of {pages.length}
          </span>
          <button
            className="button secondary"
            disabled={s.busy || start + 12 >= pages.length}
            onClick={() => setOffset(start + 12)}
          >
            Next pages
          </button>
        </div>
      )}
      {removed.length > 0 && (
        <div className="restore-bar">
          <span>{removed.length} removed pages kept in this session</span>
          <button
            className="text-button"
            disabled={s.busy}
            onClick={() =>
              s.edit(
                removed.map((p) => p.id),
                'restore',
              )
            }
          >
            Restore removed pages
          </button>
        </div>
      )}
    </>
  );
}
