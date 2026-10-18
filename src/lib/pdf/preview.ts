import type { SourceDocument } from '../types';
import { abortCheck } from '../validation/pdf';
let active = 0;
const waiting: (() => void)[] = [];
async function slot(signal: AbortSignal) {
  if (active >= 2) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    abortCheck(signal);
  } catch (e) {
    release();
    throw e;
  }
}
function release() {
  active--;
  waiting.shift()?.();
}
export async function thumbnail(
  doc: SourceDocument,
  index: number,
  extra: number,
  signal: AbortSignal,
) {
  const key = `${index}:${extra}`;
  const cached = doc.previewCache.get(key);
  if (cached) return cached;
  await slot(signal);
  let canvas: HTMLCanvasElement | undefined;
  try {
    const page = await doc.pdf.getPage(index + 1);
    abortCheck(signal);
    const angle = (((page.rotate + extra) % 360) + 360) % 360;
    const natural = page.getViewport({ scale: 1, rotation: angle });
    const viewport = page.getViewport({
      scale: Math.min(220 / natural.width, 220 / natural.height, 1),
      rotation: angle,
    });
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    const task = page.render({
      canvas,
      canvasContext: context,
      viewport,
      background: '#fff',
    });
    const cancel = () => task.cancel();
    signal.addEventListener('abort', cancel, { once: true });
    try {
      await task.promise;
    } finally {
      signal.removeEventListener('abort', cancel);
    }
    abortCheck(signal);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas!.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Preview unavailable'))),
        'image/png',
      ),
    );
    abortCheck(signal);
    doc.previewCache.set(key, blob);
    while (doc.previewCache.size > 12)
      doc.previewCache.delete(doc.previewCache.keys().next().value!);
    return blob;
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    release();
  }
}
