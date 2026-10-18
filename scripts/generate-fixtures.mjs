import {
  PDFDocument,
  PDFName,
  PDFString,
  StandardFonts,
  rgb,
  degrees,
} from 'pdf-lib';
import { PNG } from 'pngjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const fixed = new Date('2026-01-01T00:00:00Z');
for (const dir of ['public/samples', 'tests/fixtures'])
  await mkdir(dir, { recursive: true });
async function create(label, sizes, angles = [], kind = 'normal') {
  const pdf = await PDFDocument.create();
  pdf.setCreationDate(fixed);
  pdf.setModificationDate(fixed);
  pdf.setCreator('PDFMerge fixture generator');
  pdf.setProducer('PDFMerge');
  pdf.setTitle(`Original ${label} fixture`);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const colors = [
    rgb(0.16, 0.38, 0.29),
    rgb(0.28, 0.35, 0.58),
    rgb(0.63, 0.3, 0.2),
  ];
  for (const [i, size] of sizes.entries()) {
    const p = pdf.addPage(size);
    p.setRotation(degrees(angles[i] ?? 0));
    p.node.set(PDFName.of('PDFMergeLabel'), PDFString.of(`${label}-${i + 1}`));
    if (kind === 'blank') continue;
    const [w, h] = size;
    const margin = Math.min(38, w / 8);
    p.drawRectangle({
      x: 0,
      y: 0,
      width: w,
      height: h,
      color: rgb(0.96, 0.97, 0.93),
    });
    p.drawRectangle({
      x: margin,
      y: h * 0.25,
      width: w - 2 * margin,
      height: h * 0.4,
      color: colors[i % 3],
    });
    p.drawCircle({
      x: w * 0.7,
      y: h * 0.5,
      size: Math.min(w, h) * 0.13,
      color: rgb(0.94, 0.75, 0.35),
    });
    p.drawText(`${label}-${i + 1}`, {
      x: margin,
      y: h * 0.8,
      size: Math.min(42, w / 8),
      font: bold,
      color: colors[i % 3],
    });
    p.drawText('PDFMerge / original local sample', {
      x: margin,
      y: h * 0.72,
      size: Math.min(12, w / 30),
      font,
      color: rgb(0.15, 0.2, 0.17),
    });
    p.drawText(`Page ${i + 1} of ${sizes.length}`, {
      x: margin,
      y: margin,
      size: Math.min(12, w / 25),
      font,
    });
    if (kind === 'raster') {
      const png = new PNG({ width: 16, height: 16 });
      for (let n = 0; n < png.data.length; n += 4) {
        png.data[n] = 120;
        png.data[n + 1] = n % 256;
        png.data[n + 2] = 80;
        png.data[n + 3] = 255;
      }
      p.drawImage(await pdf.embedPng(PNG.sync.write(png)), {
        x: margin,
        y: h * 0.3,
        width: 80,
        height: 80,
      });
    }
    if (kind === 'crop') {
      p.setMediaBox(-10, -20, w, h);
      p.setCropBox(10, 20, w - 40, h - 60);
    }
  }
  if (kind === 'active') {
    pdf.catalog.set(
      PDFName.of('OpenAction'),
      pdf.context.obj({
        S: 'JavaScript',
        JS: PDFString.of(
          "fetch('https://example.invalid/PRIVATE-SENTINEL-8e72')",
        ),
      }),
    );
    const page = pdf.getPage(0);
    page.node.set(
      PDFName.of('AA'),
      pdf.context.obj({
        O: {
          S: 'JavaScript',
          JS: PDFString.of('globalThis.PDF_SCRIPT_EXECUTED=true'),
        },
      }),
    );
    page.node.set(
      PDFName.of('Annots'),
      pdf.context.obj([
        {
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [0, 0, 100, 100],
          A: {
            S: 'URI',
            URI: PDFString.of('https://example.invalid/PRIVATE-SENTINEL-8e72'),
          },
        },
      ]),
    );
    await pdf.attach(new Uint8Array([1, 2, 3]), 'attachment.bin');
  }
  if (kind === 'form') {
    const field = pdf.getForm().createTextField('local-field');
    field.setText('PUBLIC-FORM-VALUE');
    field.addToPage(pdf.getPage(0), { x: 40, y: 60, width: 150, height: 30 });
    pdf.getForm().updateFieldAppearances(font);
  }
  return pdf.save({ useObjectStreams: false });
}
for (const [letter, label, sizes, rotations] of [
  [
    'a',
    'A',
    [
      [612, 792],
      [612, 792],
      [612, 792],
    ],
    [],
  ],
  [
    'b',
    'B',
    [
      [792, 612],
      [792, 612],
    ],
    [],
  ],
  [
    'c',
    'C',
    [
      [420, 595],
      [595, 420],
      [360, 360],
    ],
    [0, 90, 270],
  ],
])
  await writeFile(
    `public/samples/sample-${letter}.pdf`,
    await create(label, sizes, rotations),
  );
for (const [name, label, sizes, angles, kind] of [
  ['one', 'ONE', [[612, 792]], [], 'normal'],
  [
    'portrait',
    'P',
    [
      [612, 792],
      [612, 792],
    ],
    [],
    'normal',
  ],
  ['landscape', 'L', [[792, 612]], [], 'normal'],
  [
    'mixed',
    'M',
    [
      [612, 792],
      [792, 612],
      [360, 360],
    ],
    [0, 90, 270],
    'normal',
  ],
  ['vector', 'VECTOR', [[300, 400]], [], 'normal'],
  ['raster', 'RASTER', [[300, 400]], [], 'raster'],
  ['blank', 'BLANK', [[300, 400]], [], 'blank'],
  ['crop', 'CROP', [[300, 400]], [], 'crop'],
  ['form', 'FORM', [[300, 400]], [], 'form'],
  ['sentinel', 'PRIVATE-SENTINEL-8e72', [[612, 792]], [], 'active'],
  [
    'large',
    'LARGE',
    Array.from({ length: 500 }, () => [200, 300]),
    [],
    'normal',
  ],
])
  await writeFile(
    `tests/fixtures/${name}.pdf`,
    await create(label, sizes, angles, kind),
  );
await writeFile('tests/fixtures/empty.pdf', '');
await writeFile('tests/fixtures/fake.pdf', 'Not a PDF.');
await writeFile(
  'tests/fixtures/corrupt.pdf',
  '%PDF-1.7\nno objects or cross-reference',
);
for (const name of [
  'résumé-日本語.pdf',
  'unusual name [final].pdf',
  'html-name.pdf',
])
  await writeFile(
    `tests/fixtures/${name}`,
    await readFile('tests/fixtures/one.pdf'),
  );
console.info(
  'Generated original samples and deterministic edge fixtures. Encrypted fixture is committed; optional regeneration is documented.',
);
