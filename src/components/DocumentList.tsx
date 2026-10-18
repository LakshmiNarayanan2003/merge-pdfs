import { useState } from 'react';
import { ArrowUp, ArrowDown, X, GripVertical, Layers } from 'lucide-react';
import type { MergeSession } from '../hooks/usePdfMerge';
import type { SourceDocument } from '../lib/types';
import { formatBytes } from '../lib/files/naming';
import { PageThumbnail } from './PageThumbnail';
function DocumentCard({
  doc,
  index,
  s,
  onPages,
}: {
  doc: SourceDocument;
  index: number;
  s: MergeSession;
  onPages: (id: string) => void;
}) {
  const [range, setRange] = useState('');
  const included = s.session.pages.filter(
    (p) => p.documentId === doc.id && !p.removed,
  ).length;
  return (
    <article
      className="document-card"
      data-document={doc.file.name}
      draggable={!s.busy}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/pdfmerge-document', doc.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/pdfmerge-document'))
          e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('application/pdfmerge-document');
        if (id) s.moveDocument(id, index);
      }}
    >
      <span className="drag-handle" aria-hidden="true">
        <GripVertical size={17} />
      </span>
      <PageThumbnail doc={doc} />
      <div className="document-details">
        <strong className="break-name">{doc.file.name}</strong>
        <small>
          {doc.pdf.numPages} pages · {formatBytes(doc.file.size)} · {included}{' '}
          included
        </small>
        <button
          className="text-button"
          disabled={s.busy}
          onClick={() => onPages(doc.id)}
        >
          <Layers size={13} />
          Edit pages
        </button>
      </div>
      <div className="document-actions">
        <button
          className="icon-button"
          aria-label={`Move ${doc.file.name} up`}
          disabled={s.busy || index === 0}
          onClick={() => s.moveDocument(doc.id, index - 1)}
        >
          <ArrowUp size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Move ${doc.file.name} down`}
          disabled={s.busy || index === s.session.documents.length - 1}
          onClick={() => s.moveDocument(doc.id, index + 1)}
        >
          <ArrowDown size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Remove ${doc.file.name}`}
          disabled={s.busy}
          onClick={() => s.remove(doc.id)}
        >
          <X size={16} />
        </button>
      </div>
      <details className="range-editor">
        <summary>Choose page range</summary>
        <div>
          <label htmlFor={`range-${doc.id}`}>Pages from {doc.file.name}</label>
          <div className="range-row">
            <input
              id={`range-${doc.id}`}
              value={range}
              disabled={s.busy}
              onChange={(e) => setRange(e.target.value)}
              placeholder="All pages, or 1-3,5"
            />
            <button
              className="button secondary"
              disabled={s.busy}
              onClick={() => s.range(doc.id, range)}
            >
              Apply range
            </button>
          </div>
          <p>
            Listed order is kept; duplicates are removed. Applying a range
            regroups this document’s pages. Empty restores all.
          </p>
        </div>
      </details>
      {doc.warning && <p className="document-warning">{doc.warning}</p>}
    </article>
  );
}
export function DocumentList({
  s,
  onPages,
}: {
  s: MergeSession;
  onPages: (id: string) => void;
}) {
  return (
    <div className="document-list" aria-label="Documents in order">
      {s.session.documents.map((doc, index) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          index={index}
          s={s}
          onPages={onPages}
        />
      ))}
      <p className="setting-note">
        Drag to reorder, or use the arrow buttons. Moving a document groups its
        remaining pages in their current order.
      </p>
    </div>
  );
}
