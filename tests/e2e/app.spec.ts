import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { readFile, open } from 'node:fs/promises';
import path from 'node:path';
const fixture = (name: string) => path.resolve('tests/fixtures', `${name}.pdf`);
async function upload(page: Page, files: string | string[]) {
  await page.getByLabel('PDF file picker').setInputFiles(files);
  await expect(
    page.getByRole('button', { name: /^Merge \d+ pages?$/ }),
  ).toBeEnabled();
}
async function samples(page: Page) {
  await page
    .getByRole('button', { name: 'Try sample PDFs', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Merge 8 pages' }),
  ).toBeEnabled();
}
async function output(page: Page) {
  await page.getByRole('button', { name: /^Merge \d+ pages?$/ }).click();
  await expect(
    page.getByRole('region', { name: 'Merged PDF result' }),
  ).toBeVisible();
  const event = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF', exact: true }).click();
  const download = await event;
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  return {
    pdf: await PDFDocument.load(bytes, { updateMetadata: false }),
    bytes,
    name: download.suggestedFilename(),
  };
}
function labels(pdf: PDFDocument) {
  return pdf
    .getPages()
    .map((p) =>
      (p.node.get(PDFName.of('PDFMergeLabel')) as PDFString).decodeText(),
    );
}
test.beforeEach(async ({ page }) => {
  await page.goto('./');
});
test('empty state, single PDF and valid download', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Bring your PDFs together.' }),
  ).toBeVisible();
  await upload(page, fixture('one'));
  const out = await output(page);
  expect(out.pdf.getPageCount()).toBe(1);
  expect(labels(out.pdf)).toEqual(['ONE-1']);
  expect(out.name).toBe('merged.pdf');
});
test('two PDFs merge and output follows keyboard document reorder', async ({
  page,
}) => {
  await upload(page, [
    path.resolve('public/samples/sample-a.pdf'),
    path.resolve('public/samples/sample-b.pdf'),
  ]);
  const up = page.getByRole('button', { name: 'Move sample-b.pdf up' });
  await up.focus();
  await page.keyboard.press('Enter');
  expect(labels((await output(page)).pdf)).toEqual([
    'B-1',
    'B-2',
    'A-1',
    'A-2',
    'A-3',
  ]);
});
test('three bundled samples use normal pipeline with original sizes and rotations', async ({
  page,
}) => {
  await samples(page);
  const out = await output(page);
  expect(labels(out.pdf)).toEqual([
    'A-1',
    'A-2',
    'A-3',
    'B-1',
    'B-2',
    'C-1',
    'C-2',
    'C-3',
  ]);
  expect(out.pdf.getPage(3).getSize()).toEqual({ width: 792, height: 612 });
  expect(out.pdf.getPage(6).getRotation().angle).toBe(90);
  expect(out.pdf.getPage(7).getRotation().angle).toBe(270);
});
test('page interleaving, rotation and removal match exact downloaded output', async ({
  page,
}) => {
  await samples(page);
  await page.getByRole('button', { name: 'Page View', exact: true }).click();
  await page
    .getByRole('button', { name: 'Move sample-b.pdf page 2 to beginning' })
    .click();
  await page
    .getByRole('button', { name: 'Move sample-c.pdf page 1 to beginning' })
    .click();
  await page
    .getByRole('button', { name: 'Move sample-a.pdf page 1 to beginning' })
    .click();
  await page
    .getByRole('button', { name: 'Move sample-b.pdf page 2 to beginning' })
    .click();
  await page
    .getByRole('button', { name: 'Rotate sample-b.pdf page 2 right' })
    .click();
  for (const name of [
    'sample-a.pdf page 2',
    'sample-b.pdf page 1',
    'sample-c.pdf page 2',
    'sample-c.pdf page 3',
  ])
    await page
      .getByRole('button', { name: `Remove ${name}`, exact: true })
      .click();
  const out = await output(page);
  expect(labels(out.pdf)).toEqual(['B-2', 'A-1', 'C-1', 'A-3']);
  expect(out.pdf.getPage(0).getRotation().angle).toBe(90);
  expect(out.pdf.getPageCount()).toBe(4);
});
test('range order, deduplication, validation and restoration', async ({
  page,
}) => {
  await samples(page);
  const card = page.locator('[data-document="sample-a.pdf"]');
  await card.getByText('Choose page range').click();
  const input = card.getByLabel('Pages from sample-a.pdf');
  await input.fill('9');
  await card.getByRole('button', { name: 'Apply range' }).click();
  await expect(page.getByRole('alert')).toContainText('between 1 and 3');
  await input.fill('3,1,3');
  await card.getByRole('button', { name: 'Apply range' }).click();
  expect(labels((await output(page)).pdf).slice(0, 2)).toEqual(['A-3', 'A-1']);
  await input.fill('');
  await card.getByRole('button', { name: 'Apply range' }).click();
  await expect(
    page.getByRole('button', { name: 'Merge 8 pages' }),
  ).toBeEnabled();
});
test('selection invert, batch rotation, deletion, undo and restore', async ({
  page,
}) => {
  await samples(page);
  await page.getByRole('button', { name: 'Page View', exact: true }).click();
  await page
    .getByRole('checkbox', { name: 'Select sample-a.pdf page 1', exact: true })
    .check();
  await page.getByRole('button', { name: 'Invert selection' }).click();
  await expect(page.getByText('7 selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rotate selected left' }).click();
  await page.getByRole('button', { name: 'Delete selected pages' }).click();
  expect(labels((await output(page)).pdf)).toEqual(['A-1']);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('[data-page-label]')).toHaveCount(8);
  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  await page.getByRole('button', { name: 'Delete selected pages' }).click();
  await expect(page.getByText(/All pages removed/)).toBeVisible();
  await page.getByRole('button', { name: 'Restore removed pages' }).click();
  await expect(page.locator('[data-page-label]')).toHaveCount(8);
  await page.getByRole('button', { name: 'Deselect all' }).click();
});
test('drag documents and pages with equivalent deterministic ordering', async ({
  page,
}) => {
  await samples(page);
  await page
    .locator('[data-document="sample-c.pdf"]')
    .dragTo(page.locator('[data-document="sample-a.pdf"]'));
  await expect(page.locator('[data-document]').first()).toHaveAttribute(
    'data-document',
    'sample-c.pdf',
  );
  await page.getByRole('button', { name: 'Page View' }).click();
  await page
    .locator('[data-page-label="sample-a.pdf page 1"]')
    .dragTo(page.locator('[data-page-label="sample-c.pdf page 1"]'));
  expect(labels((await output(page)).pdf).slice(0, 2)).toEqual(['A-1', 'C-1']);
});
test('filename sanitized, metadata set and output reopens with matching appearance', async ({
  page,
}) => {
  await upload(page, fixture('one'));
  const img = page.getByAltText('Preview of one.pdf, page 1', { exact: true });
  await expect(img).toBeVisible();
  const pixels = async (image: typeof img) =>
    image.evaluate((node: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      canvas.width = node.naturalWidth;
      canvas.height = node.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(node, 0, 0);
      return {
        width: canvas.width,
        height: canvas.height,
        data: Array.from(
          context.getImageData(0, 0, canvas.width, canvas.height).data,
        ),
      };
    });
  const before = await pixels(img);
  await page.getByLabel('Output filename').fill('../final.pdf.pdf');
  const out = await output(page);
  expect(out.name).toBe('final.pdf');
  expect(out.pdf.getCreator()).toBe('PDFMerge');
  expect(out.pdf.getProducer()).toBe('PDFMerge');
  expect(out.pdf.getTitle()).toBe('final');
  await page.getByRole('button', { name: 'Clear all files' }).click();
  await page.getByLabel('PDF file picker').setInputFiles({
    name: 'reopened.pdf',
    mimeType: 'application/pdf',
    buffer: out.bytes,
  });
  await expect(
    page.getByRole('button', { name: 'Merge 1 page' }),
  ).toBeEnabled();
  const afterImg = page.getByAltText('Preview of reopened.pdf, page 1', {
    exact: true,
  });
  await expect(afterImg).toBeVisible();
  const after = await pixels(afterImg);
  expect([after.width, after.height]).toEqual([before.width, before.height]);
  expect(after.data).toEqual(before.data);
  expect(new Set(after.data).size).toBeGreaterThan(20);
});
test('corrupt, fake, empty and encrypted inputs rejected; mixed valid batch recovers', async ({
  page,
}) => {
  for (const [name, message] of [
    ['corrupt', 'could not be processed'],
    ['fake', 'signature'],
    ['empty', 'empty'],
    ['encrypted', 'Password-protected'],
  ]) {
    await page.getByLabel('PDF file picker').setInputFiles(fixture(name));
    await expect(page.getByRole('alert')).toContainText(message);
    await expect(
      page.getByRole('button', { name: 'Choose PDF files' }),
    ).toBeEnabled();
  }
  await upload(page, [fixture('fake'), fixture('one')]);
  await expect(page.getByRole('alert')).toContainText('fake.pdf');
  expect((await output(page)).pdf.getPageCount()).toBe(1);
});
test('unusual Unicode and HTML-like filenames render only as text', async ({
  page,
}) => {
  await upload(page, fixture('résumé-日本語'));
  await page.getByLabel('PDF file picker').setInputFiles({
    name: '<img onerror=alert(1)>.pdf',
    mimeType: 'application/pdf',
    buffer: await readFile(fixture('html-name')),
  });
  await expect(
    page.getByRole('button', { name: 'Merge 2 pages' }),
  ).toBeEnabled();
  await expect(
    page.getByText('<img onerror=alert(1)>.pdf', { exact: true }),
  ).toBeVisible();
  expect(await page.locator('.document-details img').count()).toBe(0);
  expect((await output(page)).pdf.getPageCount()).toBe(2);
});
test('500 pages have bounded previews, responsive controls and cancellable merge', async ({
  page,
}) => {
  await upload(page, fixture('large'));
  await page.getByRole('button', { name: 'Page View' }).click();
  await expect(page.locator('[data-page-label]')).toHaveCount(12);
  await page.getByRole('button', { name: 'Next pages' }).click();
  await expect(page.locator('[data-page-label]').first()).toContainText('#13');
  await page.getByRole('button', { name: 'Merge 500 pages' }).click();
  await page.getByRole('button', { name: 'Cancel processing' }).click();
  await expect(
    page.getByText('Merge cancelled. Your pages are unchanged.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear all files' }).click();
  await upload(page, fixture('one'));
  expect((await output(page)).pdf.getPageCount()).toBe(1);
});
test('file and document count memory safeguards preserve the session', async ({
  page,
}, info) => {
  const huge = info.outputPath('huge.pdf');
  const handle = await open(huge, 'w');
  await handle.truncate(100 * 1024 * 1024 + 1);
  await handle.close();
  await page.getByLabel('PDF file picker').setInputFiles(huge);
  await expect(page.getByRole('alert')).toContainText('100 MB');
  const buffer = await readFile(fixture('one'));
  await page.getByLabel('PDF file picker').setInputFiles(
    Array.from({ length: 21 }, (_, i) => ({
      name: `local-${i}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    })),
  );
  await expect(page.getByRole('alert')).toContainText('20 PDFs');
  await expect(page.locator('[data-document]')).toHaveCount(20);
});
test('drop, add more, remove, clear and refresh release session and URLs', async ({
  page,
}) => {
  await page.evaluate(() => {
    const original = URL.revokeObjectURL;
    Object.assign(window, { revocations: 0 });
    URL.revokeObjectURL = (url) => {
      (window as unknown as { revocations: number }).revocations++;
      original(url);
    };
  });
  const bytes = await readFile(fixture('one'));
  const transfer = await page.evaluateHandle((base64) => {
    const dt = new DataTransfer();
    dt.items.add(
      new File(
        [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
        'dropped.pdf',
        { type: 'application/pdf' },
      ),
    );
    return dt;
  }, bytes.toString('base64'));
  await page
    .locator('.dropzone')
    .dispatchEvent('drop', { dataTransfer: transfer });
  await expect(
    page.getByRole('button', { name: 'Merge 1 page' }),
  ).toBeEnabled();
  await upload(page, fixture('one'));
  await expect(page.locator('[data-document]')).toHaveCount(2);
  await output(page);
  await page
    .getByRole('button', { name: 'Remove dropped.pdf', exact: true })
    .click();
  await expect(page.locator('[data-document]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear all files' }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { revocations: number }).revocations,
    ),
  ).toBeGreaterThan(0);
  await upload(page, fixture('one'));
  await page.reload();
  await expect(page.getByText('Bring your PDFs together.')).toBeVisible();
});
test('privacy: every request is static same-origin GET with no file data; scripts stay inert', async ({
  page,
  context,
}) => {
  const requests: { url: string; method: string; body: string }[] = [];
  const errors: string[] = [];
  context.on('request', (r) =>
    requests.push({
      url: r.url(),
      method: r.method(),
      body: r.postData() ?? '',
    }),
  );
  page.on('pageerror', (e) => errors.push(e.message));
  await page.evaluate(() => {
    Object.assign(window, { cspViolations: [] });
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { cspViolations: string[] }).cspViolations.push(
        e.violatedDirective,
      ),
    );
  });
  await upload(page, fixture('sentinel'));
  const out = await output(page);
  expect(out.pdf.getPage(0).node.has(PDFName.of('Annots'))).toBe(false);
  expect(out.pdf.catalog.has(PDFName.of('OpenAction'))).toBe(false);
  expect(requests.length).toBeGreaterThan(0);
  for (const r of requests.filter((r) => !r.url.startsWith('blob:'))) {
    expect(new URL(r.url).origin).toBe('http://127.0.0.1:4173');
    expect(r.method).toBe('GET');
    expect(r.body).toBe('');
    expect(new URL(r.url).pathname).toMatch(
      /\/(assets\/[^/]+|pdfjs\/(cmaps|standard_fonts|wasm)\/[^/]+|favicon.svg)$/,
    );
  }
  expect(JSON.stringify(requests)).not.toMatch(
    /sentinel|PRIVATE-SENTINEL|local-test-password|upload|analytics|telemetry/i,
  );
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => ({
      scripts:
        (window as unknown as { PDF_SCRIPT_EXECUTED?: boolean })
          .PDF_SCRIPT_EXECUTED ?? false,
      violations: (window as unknown as { cspViolations: string[] })
        .cspViolations,
    })),
  ).toEqual({ scripts: false, violations: [] });
  expect(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: (await indexedDB.databases()).length,
      workers: (await navigator.serviceWorker.getRegistrations()).length,
      caches: (await caches.keys()).length,
    })),
  ).toEqual({ local: 0, session: 0, databases: 0, workers: 0, caches: 0 });
});
test('accessibility, keyboard and themes in empty, loaded, page and result states', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to merger' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await samples(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Page View' }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const first = page.getByRole('button', {
    name: 'Move sample-a.pdf page 1 right',
  });
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-page-label]').first()).toHaveAttribute(
    'data-page-label',
    'sample-a.pdf page 2',
  );
  await output(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [768, 1024],
  [390, 844],
])
  test(`responsive workflow ${width}x${height}, both themes`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await samples(page);
    await page.getByRole('button', { name: 'Page View' }).click();
    for (const dark of [false, true]) {
      if (dark)
        await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width === 390)
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
    }
    await page
      .getByRole('button', { name: 'Rotate sample-a.pdf page 1 right' })
      .click();
    await page
      .getByRole('button', { name: 'Remove sample-a.pdf page 2' })
      .click();
    const out = await output(page);
    expect(out.pdf.getPageCount()).toBe(7);
    expect(out.pdf.getPage(0).getRotation().angle).toBe(90);
  });
test('form warnings and safe output behavior', async ({ page }) => {
  await upload(page, fixture('form'));
  await expect(page.getByText(/Form fields are not preserved/)).toBeVisible();
  const out = await output(page);
  expect(out.pdf.catalog.has(PDFName.of('AcroForm'))).toBe(false);
  expect(out.pdf.getPage(0).node.has(PDFName.of('Annots'))).toBe(false);
});
test('cancel sample loading aborts pending requests and keeps the workspace empty', async ({
  page,
}) => {
  let pending: (() => Promise<void>) | undefined;
  await page.route('**/samples/sample-a.pdf', (route) => {
    pending = () => route.abort();
  });
  await page
    .getByRole('button', { name: 'Try sample PDFs', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cancel processing' }).click();
  await pending?.();
  await expect(
    page.getByText('Opening cancelled. No new files were added.'),
  ).toBeVisible();
  await expect(page.getByText('Bring your PDFs together.')).toBeVisible();
  await page.unroute('**/samples/sample-a.pdf');
  await upload(page, fixture('one'));
  expect((await output(page)).pdf.getPageCount()).toBe(1);
});
