import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const base = process.env.VITE_BASE_PATH || '/merge-pdfs/';
const url = `http://127.0.0.1:4173${base}`;
let server;
let browser;
try {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Unavailable');
  } catch {
    server = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4173',
        '--strictPort',
      ],
      { stdio: 'ignore' },
    );
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(url)).ok) {
          ready = true;
          break;
        }
      } catch {
        // The preview process may still be starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('Preview server did not start');
  }
  browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    deviceScaleFactor: 1,
  });
  await mkdir('docs/images', { recursive: true });
  page.setDefaultTimeout(30_000);
  await page.goto(url);
  const capture = async (name) =>
    page.screenshot({ path: `docs/images/${name}.png`, fullPage: true });
  await capture('desktop');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await capture('desktop-dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page
    .getByRole('button', { name: 'Try sample PDFs', exact: true })
    .click();
  await page.getByRole('button', { name: 'Merge 8 pages' }).waitFor();
  await page
    .getByAltText('Preview of sample-a.pdf, page 1', { exact: true })
    .waitFor();
  await capture('workspace');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await capture('workspace-dark');
  await page.setViewportSize({ width: 390, height: 844 });
  await capture('mobile-dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await capture('mobile');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Page View' }).click();
  await page
    .getByAltText('Preview of sample-a.pdf, page 3', { exact: true })
    .waitFor();
  await capture('page-view');
  await page.getByRole('button', { name: 'Merge 8 pages' }).click();
  await page.getByRole('region', { name: 'Merged PDF result' }).waitFor();
  await capture('result');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(
    `<html><body style="margin:0;background:#edf4ed;color:#273c33;font-family:Arial,sans-serif"><main style="padding:75px"><div style="font-size:28px;font-weight:700">PDFMerge <span style="font-size:12px;letter-spacing:2px;margin-left:20px">FREE & OPEN SOURCE</span></div><h1 style="font-size:80px;letter-spacing:-4px;font-weight:500;margin:70px 0 24px">Merge PDFs.<br><em style="font-family:Georgia;color:#285f49">Keep them private.</em></h1><p style="font-size:25px">PDFs in. One PDF out.</p><p style="margin-top:35px;font-size:18px;color:#285f49">No upload. No account. No telemetry.</p></main></body></html>`,
  );
  await page.screenshot({ path: 'public/social-preview.png' });
  console.info(
    'Captured eight real application screenshots and original social card.',
  );
} finally {
  await browser?.close();
  server?.kill();
}
