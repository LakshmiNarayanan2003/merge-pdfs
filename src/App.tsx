import { useState } from 'react';
import { Plus, LockKeyhole, Undo2, Trash2, Check } from 'lucide-react';
import { usePdfMerge } from './hooks/usePdfMerge';
import { Header, Hero } from './components/Brand';
import { Dropzone } from './components/Dropzone';
import { DocumentList } from './components/DocumentList';
import { PageGrid } from './components/PageGrid';
import { MergeSettings } from './components/MergeSettings';
import { Result } from './components/Result';
import { Info } from './components/Info';
export default function App() {
  const s = usePdfMerge();
  const [view, setView] = useState<'documents' | 'pages'>('documents');
  const [offset, setOffset] = useState(0);
  return (
    <>
      <a className="skip-link" href="#merger">
        Skip to merger
      </a>
      <Header dark={s.dark} onToggle={() => s.setDark(!s.dark)} />
      <main>
        <Hero />
        <section
          id="merger"
          className="converter"
          aria-label="PDF merger"
          tabIndex={-1}
        >
          <div className="converter-bar">
            <span>
              <span className="status-dot" />
              YOUR PRIVATE WORKSPACE
            </span>
            <span>
              <LockKeyhole size={13} />
              On your device. Always.
            </span>
          </div>
          <div className="converter-body">
            <div className="workspace">
              <input
                ref={(node) => s.setPicker(node)}
                hidden
                type="file"
                multiple
                accept=".pdf,application/pdf"
                aria-label="PDF file picker"
                disabled={s.busy}
                onChange={(e) => {
                  void s.ingest(Array.from(e.target.files ?? []));
                  e.target.value = '';
                }}
              />
              {!s.session.documents.length ? (
                <Dropzone s={s} />
              ) : (
                <>
                  <div className="workspace-toolbar">
                    <h2>
                      Your PDFs{' '}
                      <span>{s.session.documents.length} documents</span>
                    </h2>
                    <div>
                      <button
                        className="text-button"
                        disabled={s.busy}
                        onClick={s.browse}
                      >
                        <Plus size={15} />
                        Add PDFs
                      </button>
                      <button
                        className="icon-button"
                        disabled={s.busy}
                        onClick={s.clear}
                        aria-label="Clear all files"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="view-toolbar">
                    <div
                      className="view-switch"
                      role="group"
                      aria-label="Workspace view"
                    >
                      <button
                        aria-pressed={view === 'documents'}
                        onClick={() => setView('documents')}
                      >
                        Document View
                      </button>
                      <button
                        aria-pressed={view === 'pages'}
                        onClick={() => setView('pages')}
                      >
                        Page View
                      </button>
                    </div>
                    <button
                      className="text-button"
                      disabled={s.busy || !s.canUndo}
                      onClick={s.undo}
                    >
                      <Undo2 size={14} />
                      Undo
                    </button>
                  </div>
                  {view === 'documents' ? (
                    <DocumentList
                      s={s}
                      onPages={(id) => {
                        const index = s.session.pages
                          .filter((p) => !p.removed)
                          .findIndex((p) => p.documentId === id);
                        setOffset(Math.max(0, index));
                        setView('pages');
                      }}
                    />
                  ) : (
                    <PageGrid s={s} offset={offset} setOffset={setOffset} />
                  )}
                </>
              )}
              <div className="workspace-footnote">
                <LockKeyhole size={13} />
                Processed locally. Nothing uploaded.
                <Check size={14} />
              </div>
            </div>
            <MergeSettings s={s} />
          </div>
          {s.errors.length > 0 && (
            <div className="message error" role="alert">
              {s.errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
              <button className="text-button" onClick={() => s.setErrors([])}>
                Dismiss errors
              </button>
            </div>
          )}
          <div className="live-status" role="status" aria-live="polite">
            {s.notice && <p className="message">{s.notice}</p>}
          </div>
          {s.result && <Result result={s.result} onClear={s.clear} />}
        </section>
        <div className="under-converter">
          <span>
            <Check size={14} />
            Text & vectors stay sharp
          </span>
          <span>
            <Check size={14} />
            Arrange every page
          </span>
          <span>
            <Check size={14} />
            No sign-up. No paid quotas.
          </span>
        </div>
        <Info />
      </main>
    </>
  );
}
