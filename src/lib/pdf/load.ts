import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { abortCheck, UserError, validateFile } from '../validation/pdf';
import type { SourceDocument } from '../types';
GlobalWorkerOptions.workerSrc = workerUrl;
export function openBytes(data: Uint8Array) {
  const asset = (dir: string) => `${import.meta.env.BASE_URL}pdfjs/${dir}/`;
  return getDocument({
    data,
    cMapUrl: asset('cmaps'),
    cMapPacked: true,
    standardFontDataUrl: asset('standard_fonts'),
    wasmUrl: asset('wasm'),
    useWorkerFetch: true,
    useSystemFonts: false,
    enableXfa: false,
    stopAtErrors: true,
    verbosity: 0,
    canvasMaxAreaInBytes: 8_000_000,
  });
}
export async function loadPdf(
  file: File,
  signal: AbortSignal,
): Promise<SourceDocument> {
  await validateFile(file);
  abortCheck(signal);
  const data = new Uint8Array(await file.arrayBuffer());
  abortCheck(signal);
  const task = openBytes(data);
  let encrypted = false;
  const cancel = () => {
    void task.destroy();
  };
  task.onPassword = () => {
    encrypted = true;
    cancel();
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    const pdf = await task.promise;
    abortCheck(signal);
    if (!pdf.numPages || pdf.numPages > 1000)
      throw new UserError('Open a PDF with 1–1000 pages.');
    const metadata = await pdf.getMetadata();
    const info = metadata.info as {
      IsAcroFormPresent?: boolean;
      IsXFAPresent?: boolean;
    };
    return {
      id: crypto.randomUUID(),
      file,
      pdf,
      previewCache: new Map(),
      warning:
        info.IsAcroFormPresent || info.IsXFAPresent
          ? 'Form fields are not preserved. Fill and flatten a copy in a trusted PDF editor first.'
          : undefined,
    };
  } catch (error) {
    await task.destroy();
    if (encrypted)
      throw new UserError(
        'Password-protected PDFs are not supported for merging. Export an unencrypted copy in a trusted local PDF editor first. Nothing was uploaded.',
      );
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
  }
}
export function disposeDocument(doc: SourceDocument) {
  doc.previewCache.clear();
  void doc.pdf.loadingTask.destroy();
}
export async function validateOutput(bytes: Uint8Array, count: number) {
  const task = openBytes(bytes);
  try {
    const pdf = await task.promise;
    if (pdf.numPages !== count)
      throw new UserError('Output page count did not match.');
    const page = await pdf.getPage(1);
    await page.getOperatorList();
  } finally {
    await task.destroy();
  }
}
