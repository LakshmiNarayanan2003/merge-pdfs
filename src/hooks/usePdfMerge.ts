import { useEffect, useRef, useState } from 'react';
import type { Output, PageItem, Progress, Session } from '../lib/types';
import {
  applyRange,
  createPages,
  editPages,
  mergePlan,
  moveDocument,
  movePage,
  parseRange,
  selectPages,
} from '../lib/state/ordering';
import { abortCheck, checkLimits, friendlyError } from '../lib/validation/pdf';
import { outputName } from '../lib/files/naming';
const empty: Session = { documents: [], pages: [] };
export function usePdfMerge() {
  const [session, setSession] = useState<Session>(empty);
  const current = useRef(session);
  const [undo, setUndo] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const operation = useRef<AbortController | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<Output | null>(null);
  const resultRef = useRef<Output | null>(null);
  const [name, setName] = useState('merged.pdf');
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const picker = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(
    () => () => {
      operation.current?.abort();
      void import('../lib/pdf/load').then(({ disposeDocument }) =>
        current.current.documents.forEach(disposeDocument),
      );
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    },
    [],
  );
  function invalidate() {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    resultRef.current = null;
    setResult(null);
  }
  function commit(next: Session, history = true) {
    if (history) setUndo(current.current);
    current.current = next;
    setSession(next);
    invalidate();
  }
  function pages(next: PageItem[]) {
    if (!operation.current) {
      commit({ ...current.current, pages: next });
      setNotice('Page arrangement updated.');
    }
  }
  async function ingest(
    getFiles: File[] | ((signal: AbortSignal) => Promise<File[]>),
  ) {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setErrors([]);
    setNotice('');
    invalidate();
    const loaded: Session = { documents: [], pages: [] };
    const failures: string[] = [];
    try {
      const files =
        typeof getFiles === 'function'
          ? await getFiles(controller.signal)
          : getFiles;
      const { loadPdf, disposeDocument } = await import('../lib/pdf/load');
      for (const [i, file] of files.entries()) {
        abortCheck(controller.signal);
        setProgress({
          completed: i,
          total: files.length,
          stage: `Opening PDF ${i + 1} of ${files.length}…`,
        });
        try {
          checkLimits(
            current.current.documents.length + loaded.documents.length + 1,
            current.current.documents.reduce((n, d) => n + d.file.size, 0) +
              loaded.documents.reduce((n, d) => n + d.file.size, 0) +
              file.size,
            0,
          );
          const doc = await loadPdf(file, controller.signal);
          try {
            checkLimits(
              0,
              0,
              current.current.pages.length +
                loaded.pages.length +
                doc.pdf.numPages,
            );
            loaded.pages.push(...createPages(doc));
            loaded.documents.push(doc);
          } catch (e) {
            disposeDocument(doc);
            throw e;
          }
        } catch (e) {
          abortCheck(controller.signal);
          failures.push(`${file.name}: ${friendlyError(e)}`);
        }
      }
      commit(
        {
          documents: [...current.current.documents, ...loaded.documents],
          pages: [...current.current.pages, ...loaded.pages],
        },
        false,
      );
      setUndo(null);
      setErrors(failures);
      setNotice(
        `${loaded.documents.length} PDF${loaded.documents.length === 1 ? '' : 's'} added. Arrange your pages, then merge.`,
      );
    } catch (e) {
      const { disposeDocument } = await import('../lib/pdf/load');
      loaded.documents.forEach(disposeDocument);
      if (controller.signal.aborted)
        setNotice('Opening cancelled. No new files were added.');
      else setErrors([friendlyError(e)]);
    } finally {
      operation.current = null;
      setBusy(false);
      setProgress(null);
    }
  }
  function samples() {
    void ingest(async (signal) => {
      const files = [];
      for (const letter of ['a', 'b', 'c']) {
        const response = await fetch(
          `${import.meta.env.BASE_URL}samples/sample-${letter}.pdf`,
          { signal },
        );
        if (!response.ok) throw new Error('Sample unavailable');
        files.push(
          new File([await response.blob()], `sample-${letter}.pdf`, {
            type: 'application/pdf',
          }),
        );
      }
      return files;
    });
  }
  async function merge() {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setErrors([]);
    setNotice('');
    invalidate();
    try {
      const plan = mergePlan(current.current.pages);
      const filename = outputName(name);
      setProgress({
        completed: 0,
        total: plan.length,
        stage: 'Preparing PDFs…',
      });
      const { runMerge } = await import('../lib/pdf/run');
      const bytes = await runMerge(
        current.current.documents,
        plan,
        filename,
        controller.signal,
        setProgress,
      );
      abortCheck(controller.signal);
      setProgress({
        completed: plan.length,
        total: plan.length,
        stage: 'Checking output readability…',
      });
      const { validateOutput } = await import('../lib/pdf/load');
      await validateOutput(bytes.slice(), plan.length);
      abortCheck(controller.signal);
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], {
        type: 'application/pdf',
      });
      const output = {
        url: URL.createObjectURL(blob),
        blob,
        name: filename,
        count: plan.length,
      };
      resultRef.current = output;
      setResult(output);
      setNotice('Merged successfully. Your download is ready.');
    } catch (e) {
      if (controller.signal.aborted)
        setNotice('Merge cancelled. Your pages are unchanged.');
      else setErrors([friendlyError(e)]);
    } finally {
      operation.current = null;
      setBusy(false);
      setProgress(null);
    }
  }
  function clear() {
    if (operation.current) return;
    const docs = current.current.documents;
    commit(empty, false);
    setUndo(null);
    setErrors([]);
    setNotice('Files cleared from this session.');
    void import('../lib/pdf/load').then(({ disposeDocument }) =>
      docs.forEach(disposeDocument),
    );
  }
  function remove(id: string) {
    if (operation.current) return;
    const doc = current.current.documents.find((d) => d.id === id);
    commit(
      {
        documents: current.current.documents.filter((d) => d.id !== id),
        pages: current.current.pages.filter((p) => p.documentId !== id),
      },
      false,
    );
    setUndo(null);
    setNotice('Document removed.');
    if (doc)
      void import('../lib/pdf/load').then(({ disposeDocument }) =>
        disposeDocument(doc),
      );
  }
  return {
    session,
    busy,
    errors,
    setErrors,
    notice,
    progress,
    result,
    name,
    setName: (value: string) => {
      setName(value);
      invalidate();
    },
    dark,
    setDark,
    setPicker: (node: HTMLInputElement | null) => {
      picker.current = node;
    },
    browse: () => picker.current?.click(),
    ingest,
    samples,
    merge,
    clear,
    remove,
    cancel: () => operation.current?.abort(),
    updatePages: pages,
    movePage: (id: string, to: number) =>
      pages(movePage(current.current.pages, id, to)),
    moveDocument: (id: string, to: number) => {
      if (!operation.current) {
        commit(moveDocument(current.current, id, to));
        setNotice(
          'Document moved. Its pages are grouped in their current order.',
        );
      }
    },
    edit: (ids: string[], action: 'remove' | 'left' | 'right' | 'restore') =>
      pages(editPages(current.current.pages, ids, action)),
    select: (mode: 'all' | 'none' | 'invert') =>
      pages(selectPages(current.current.pages, mode)),
    range: (id: string, text: string) => {
      try {
        const doc = current.current.documents.find((d) => d.id === id)!;
        pages(
          applyRange(
            current.current.pages,
            id,
            parseRange(text, doc.pdf.numPages),
          ),
        );
        setErrors([]);
      } catch (e) {
        setErrors([friendlyError(e)]);
      }
    },
    undo: () => {
      if (undo && !operation.current) {
        commit(undo, false);
        setUndo(null);
        setNotice('Last page edit undone.');
      }
    },
    canUndo: !!undo,
  };
}
export type MergeSession = ReturnType<typeof usePdfMerge>;
