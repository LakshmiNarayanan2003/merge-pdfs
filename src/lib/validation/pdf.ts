export const LIMITS = {
  documents: 20,
  file: 100 * 1024 * 1024,
  total: 500 * 1024 * 1024,
  pages: 1000,
} as const;
export class UserError extends Error {}
export function signature(bytes: Uint8Array) {
  return /^%PDF-\d\.\d/.test(
    new TextDecoder('latin1').decode(bytes.subarray(0, 16)),
  );
}
export function checkLimits(count: number, bytes: number, pages: number) {
  if (count > LIMITS.documents)
    throw new UserError('Open up to 20 PDFs at once. Remove a document first.');
  if (bytes > LIMITS.total)
    throw new UserError('Combined input exceeds the 500 MB memory safeguard.');
  if (pages > LIMITS.pages)
    throw new UserError(
      'Open up to 1000 pages per session. Split larger PDFs first.',
    );
}
export async function validateFile(file: File) {
  if (!file.size)
    throw new UserError('This file is empty. Choose a valid PDF.');
  if (file.size > LIMITS.file)
    throw new UserError('This PDF exceeds the 100 MB memory safeguard.');
  if (
    !/\.pdf$/i.test(file.name) ||
    (file.type &&
      !['application/pdf', 'application/octet-stream'].includes(file.type))
  )
    throw new UserError('Choose a PDF file (.pdf).');
  if (!signature(new Uint8Array(await file.slice(0, 16).arrayBuffer())))
    throw new UserError('This file does not have a valid PDF signature.');
}
export function abortCheck(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
}
export function friendlyError(error: unknown) {
  return error instanceof UserError
    ? error.message
    : 'This PDF could not be processed. It may be corrupt, unsupported, or exceed available browser memory.';
}
