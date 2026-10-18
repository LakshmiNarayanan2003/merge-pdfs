// @vitest-environment node
import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { mergePdf } from './merge';
import type { MergePage } from '../types';
const read = async (path: string) => new Uint8Array(await readFile(path));
const p = (
  documentId: string,
  sourcePageIndex: number,
  rotation = 0,
): MergePage => ({
  id: `${documentId}-${sourcePageIndex}`,
  documentId,
  sourcePageIndex,
  rotation,
});
const labels = (pdf: PDFDocument) =>
  pdf
    .getPages()
    .map((p) =>
      (p.node.get(PDFName.of('PDFMergeLabel')) as PDFString).decodeText(),
    );
it('merges B2 A1 C1 A3 exactly, preserving dimensions, rotation and metadata', async () => {
  const sources = await Promise.all(
    ['a', 'b', 'c'].map(async (id) => ({
      id,
      bytes: await read(`public/samples/sample-${id}.pdf`),
    })),
  );
  const out = await mergePdf(
    sources,
    [p('b', 1, 90), p('a', 0), p('c', 0), p('a', 2)],
    'ordered.pdf',
  );
  expect(new TextDecoder().decode(out.subarray(0, 5))).toBe('%PDF-');
  const pdf = await PDFDocument.load(out, { updateMetadata: false });
  expect(labels(pdf)).toEqual(['B-2', 'A-1', 'C-1', 'A-3']);
  expect(pdf.getPageCount()).toBe(4);
  expect(pdf.getPage(0).getSize()).toEqual({ width: 792, height: 612 });
  expect(pdf.getPage(0).getRotation().angle).toBe(90);
  expect(pdf.getPage(2).getSize()).toEqual({ width: 420, height: 595 });
  expect(pdf.getCreator()).toBe('PDFMerge');
  expect(pdf.getProducer()).toBe('PDFMerge');
  expect(pdf.getTitle()).toBe('ordered');
  expect(pdf.getAuthor()).toBe('');
});
it('preserves text as text, with no page rasterization', async () => {
  const out = await mergePdf(
    [{ id: 'a', bytes: await read('public/samples/sample-a.pdf') }],
    [p('a', 2), p('a', 0)],
    'text.pdf',
  );
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: out.slice(), verbosity: 0 });
  try {
    const pdf = await task.promise;
    const texts = [];
    for (let i = 1; i <= 2; i++) {
      const page = await pdf.getPage(i);
      texts.push(
        (await page.getTextContent()).items
          .filter((item) => 'str' in item)
          .map((item) => item.str)
          .join(' '),
      );
    }
    expect(texts[0]).toContain('A-3');
    expect(texts[1]).toContain('A-1');
  } finally {
    await task.destroy();
  }
});
it.each(['raster', 'vector', 'blank', 'crop', 'mixed'])(
  'copies %s and retains page boxes and inherited rotation',
  async (kind) => {
    const bytes = await read(`tests/fixtures/${kind}.pdf`);
    const source = await PDFDocument.load(bytes);
    const out = await mergePdf(
      [{ id: 'a', bytes }],
      [p('a', 0, 270)],
      'out.pdf',
    );
    const output = await PDFDocument.load(out);
    expect(output.getPage(0).getMediaBox()).toEqual(
      source.getPage(0).getMediaBox(),
    );
    expect(output.getPage(0).getCropBox()).toEqual(
      source.getPage(0).getCropBox(),
    );
    expect(output.getPage(0).getRotation().angle).toBe(
      (source.getPage(0).getRotation().angle + 270) % 360,
    );
  },
);
it('does not import document scripts, attachments, page actions or annotations', async () => {
  const output = await PDFDocument.load(
    await mergePdf(
      [{ id: 'x', bytes: await read('tests/fixtures/sentinel.pdf') }],
      [p('x', 0)],
      'safe.pdf',
    ),
  );
  for (const key of ['Names', 'OpenAction', 'AA', 'AcroForm', 'Outlines'])
    expect(output.catalog.has(PDFName.of(key))).toBe(false);
  for (const key of ['Annots', 'AA', 'A'])
    expect(output.getPage(0).node.has(PDFName.of(key))).toBe(false);
});
it('removes form widgets and does not promise form preservation', async () => {
  const output = await PDFDocument.load(
    await mergePdf(
      [{ id: 'x', bytes: await read('tests/fixtures/form.pdf') }],
      [p('x', 0)],
      'form.pdf',
    ),
  );
  expect(output.catalog.has(PDFName.of('AcroForm'))).toBe(false);
  expect(output.getPage(0).node.has(PDFName.of('Annots'))).toBe(false);
});
it('rejects encrypted input without ignoring encryption', async () =>
  await expect(
    mergePdf(
      [{ id: 'x', bytes: await read('tests/fixtures/encrypted.pdf') }],
      [p('x', 0)],
      'x.pdf',
    ),
  ).rejects.toThrow(/encrypted/));
it('rejects corrupt input', async () =>
  await expect(
    mergePdf(
      [{ id: 'x', bytes: await read('tests/fixtures/corrupt.pdf') }],
      [p('x', 0)],
      'x.pdf',
    ),
  ).rejects.toThrow());
it('rejects missing source', async () =>
  await expect(mergePdf([], [p('missing', 0)], 'x.pdf')).rejects.toThrow(
    'unavailable',
  ));
it('rejects out-of-bounds page', async () =>
  await expect(
    mergePdf(
      [{ id: 'x', bytes: await read('tests/fixtures/one.pdf') }],
      [p('x', 2)],
      'x.pdf',
    ),
  ).rejects.toThrow('unavailable'));
it('rejects empty and duplicate plans', async () => {
  await expect(mergePdf([], [], 'x.pdf')).rejects.toThrow();
  await expect(mergePdf([], [p('x', 0), p('x', 0)], 'x.pdf')).rejects.toThrow();
});
it('checks cancellation', async () =>
  await expect(
    mergePdf(
      [{ id: 'x', bytes: await read('tests/fixtures/one.pdf') }],
      [p('x', 0)],
      'x.pdf',
      () => {},
      () => true,
    ),
  ).rejects.toThrow('Cancelled'));
