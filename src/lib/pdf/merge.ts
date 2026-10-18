import { PDFDocument, PDFName, degrees } from 'pdf-lib';
import type { MergePage, MergeSource, Progress } from '../types';
import { signature, UserError } from '../validation/pdf';
import { rotation } from '../state/ordering';
export async function mergePdf(
  sources: MergeSource[],
  plan: MergePage[],
  name: string,
  onProgress: (p: Progress) => void = () => {},
  cancelled: () => boolean = () => false,
): Promise<Uint8Array> {
  if (
    !plan.length ||
    plan.length > 1000 ||
    new Set(plan.map((p) => p.id)).size !== plan.length
  )
    throw new UserError('Invalid output page plan.');
  const output = await PDFDocument.create();
  const inputs = new Map<string, PDFDocument>();
  for (const source of sources) {
    if (cancelled()) throw new DOMException('Cancelled', 'AbortError');
    const pdf = await PDFDocument.load(source.bytes, { updateMetadata: false });
    if (pdf.isEncrypted)
      throw new UserError('Password-protected PDFs are not supported.');
    inputs.set(source.id, pdf);
  }
  for (const [i, item] of plan.entries()) {
    if (cancelled()) throw new DOMException('Cancelled', 'AbortError');
    const input = inputs.get(item.documentId);
    if (
      !input ||
      !Number.isInteger(item.sourcePageIndex) ||
      item.sourcePageIndex < 0 ||
      item.sourcePageIndex >= input.getPageCount() ||
      ![0, 90, 180, 270].includes(item.rotation)
    )
      throw new UserError('An output page is unavailable.');
    const original = input.getPage(item.sourcePageIndex);
    // Do not import interactive annotations, page actions or form widgets.
    for (const key of ['Annots', 'AA', 'A'])
      original.node.delete(PDFName.of(key));
    const [page] = await output.copyPages(input, [item.sourcePageIndex]);
    page.setRotation(
      degrees(rotation(original.getRotation().angle + item.rotation)),
    );
    output.addPage(page);
    onProgress({
      completed: i + 1,
      total: plan.length,
      stage: `Copying page ${i + 1} of ${plan.length}…`,
    });
  }
  output.setTitle(name.replace(/\.pdf$/i, ''));
  output.setCreator('PDFMerge');
  output.setProducer('PDFMerge');
  output.setAuthor('');
  output.setSubject('');
  output.setKeywords([]);
  onProgress({
    completed: plan.length,
    total: plan.length,
    stage: 'Finalizing PDF…',
  });
  const bytes = await output.save();
  if (!bytes.length || !signature(bytes))
    throw new UserError('The output PDF could not be generated.');
  const parsed = await PDFDocument.load(bytes, { updateMetadata: false });
  if (parsed.getPageCount() !== plan.length)
    throw new UserError('The output PDF failed validation.');
  return bytes;
}
