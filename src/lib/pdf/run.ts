import type { MergePage, Progress, SourceDocument } from '../types';
import { abortCheck, UserError } from '../validation/pdf';
export function runMerge(
  documents: SourceDocument[],
  plan: MergePage[],
  name: string,
  signal: AbortSignal,
  onProgress: (p: Progress) => void,
): Promise<Uint8Array> {
  abortCheck(signal);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./merge.worker.ts', import.meta.url), {
      type: 'module',
    });
    const finish = () => {
      signal.removeEventListener('abort', cancel);
      worker.terminate();
    };
    const cancel = () => {
      finish();
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    signal.addEventListener('abort', cancel, { once: true });
    worker.onmessage = (
      event: MessageEvent<{
        progress?: Progress;
        error?: string;
        bytes?: Uint8Array;
      }>,
    ) => {
      if (event.data.progress) onProgress(event.data.progress);
      else {
        finish();
        if (event.data.bytes) resolve(event.data.bytes);
        else reject(new UserError(event.data.error ?? 'Merge failed.'));
      }
    };
    worker.onerror = () => {
      finish();
      reject(
        new UserError(
          'The merge worker could not finish. Try fewer or smaller PDFs.',
        ),
      );
    };
    worker.postMessage({
      sources: documents
        .filter((d) => plan.some((p) => p.documentId === d.id))
        .map((d) => ({ id: d.id, file: d.file })),
      plan,
      name,
    });
  });
}
