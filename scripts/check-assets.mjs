import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir)).map(async (name) => {
        const p = `${dir}/${name}`;
        return (await stat(p)).isDirectory() ? files(p) : [p];
      }),
    )
  ).flat();
}
const html = await readFile('dist/index.html', 'utf8');
for (const directive of [
  "connect-src 'self'",
  "form-action 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "worker-src 'self'",
])
  assert(html.includes(directive), `Missing CSP: ${directive}`);
assert(!html.includes("script-src 'self' 'unsafe-eval'"));
for (const match of html.matchAll(
  /<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g,
)) {
  if (match[0].includes('canonical')) continue;
  assert(
    !/^https?:/.test(match[1]),
    `Remote executable/style asset: ${match[1]}`,
  );
}
const source = await files('src');
for (const file of source.filter(
  (f) => /\.(ts|tsx|css)$/.test(f) && !f.includes('.test.'),
)) {
  const text = await readFile(file, 'utf8');
  assert(
    !/\b(?:fetch|import)\s*\(\s*['"`]https?:/.test(text),
    `Remote runtime import/request in ${file}`,
  );
  assert(
    !/navigator\.sendBeacon|XMLHttpRequest|serviceWorker\.register|localStorage|sessionStorage|indexedDB/.test(
      text,
    ),
    `Unexpected persistence/network primitive in ${file}`,
  );
  assert(
    !/dangerouslySetInnerHTML/.test(text),
    `Unsafe HTML injection in ${file}`,
  );
}
const outputs = await files('dist');
assert(
  outputs.some((f) => /pdf\.worker.*\.mjs$/.test(f)),
  'Missing PDF.js worker',
);
for (const dir of ['cmaps', 'standard_fonts', 'wasm'])
  assert(
    outputs.some((f) => f.includes(`/pdfjs/${dir}/`)),
    `Missing ${dir}`,
  );
for (const letter of ['a', 'b', 'c']) {
  const sample = await readFile(`dist/samples/sample-${letter}.pdf`);
  assert(sample.subarray(0, 5).toString() === '%PDF-', 'Invalid sample PDF');
}
assert(
  outputs.some((f) => /merge.worker.*\.js$/.test(f)),
  'Missing merge worker',
);
assert(
  !outputs.some((f) => /\.map$|\.env|service-worker/.test(f)),
  'Unexpected private/source/cache asset',
);
console.log(
  `Static privacy/CSP checks passed; ${outputs.length} local build assets checked.`,
);
