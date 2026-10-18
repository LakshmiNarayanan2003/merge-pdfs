# Testing

Use Node 24.19.0 LTS and npm. Fixtures contain only original public synthetic content, never personal PDFs. Exact observed results are in [VERIFICATION.md](VERIFICATION.md).

```sh
npm ci
npm run fixtures
npm run format
npm run check
npx playwright install --with-deps chromium firefox webkit
npm run check:full
```

`check:full` is the complete repeatable suite after browser prerequisites: fixtures, types, lint, format check, unit/component/engine tests, build, static/privacy/docs checks, coverage, browser tests, screenshots and npm audit. `npm test` includes both pure/engine and React component tests. `npm run test:coverage` reports V8 coverage without an arbitrary passing threshold.

## Meaningful assertions

Pure state/validation tests cover filename safety, identities, ranges/entered order/deduplication, selection, rotate/remove/restore, document grouping, page interleaving, duplicate plans, limits/preallocation, signatures and safe errors. React Testing Library tests cover empty/load/reorder/remove/clear, page mode/selection/ranges, encryption rejection, merge success/failure/progress/cancel, theme and result URL invalidation. Components isolate PDF parser/worker boundaries with test doubles; real browser/engine tests exercise actual libraries.

Engine tests load generated source PDFs and verify downloaded-content properties: B2/A1/C1/A3 labels, text extraction with PDF.js, dimensions, crop boxes, rotations, metadata, removed pages/empty/invalid sources, and absence of interactive catalog/page keys. No blob-size-only success assertions.

Playwright runs against the actual production subpath. The same cases are configured for Chromium, Firefox and WebKit. Tests cover one/two/three-file output, document keyboard/drag reorder, cross-document page interleaving, rotation/remove, ranges, selection/invert/undo/restore, downloads/filename/metadata, output reopen and pixel equality, bad/empty/encrypted files, hostile/Unicode names, 500-page pagination/cancel, resource caps, drop/add/clear/refresh/URL revocation, forms, privacy and accessibility. Responsive workflows cover 1440×900, 1280×800, 768×1024 and 390×844 in both themes.

The network test records context requests including workers, permits only expected static same-origin GETs without bodies and rejects sentinel filenames/content. It checks storage/service worker absence, CSP violations and inert input JavaScript. Public sample fetches are intentionally tested separately from user-input privacy. Axe runs on empty, dark, loaded, page, result and mobile states; keyboard tests exercise real controls. No formal accessibility certification is claimed.

## Fixtures and screenshots

`npm run fixtures` deterministically regenerates original portrait, landscape, mixed/rotated, text/vector/raster, blank, unusual MediaBox/CropBox, form, active-action/annotation/attachment, large-page-count, corrupt/fake/empty and unusual-filename fixtures plus three public samples. Every page has a distinct programmatic PDFMergeLabel and visible source label. Fixed source dates ensure reproducibility.

The committed encrypted fixture uses public password `local-test-password` (not a secret). Optional regeneration: create an isolated Python environment, install `pypdf==6.19.0`, run `python scripts/generate-encrypted-fixture.py`. Fixed IDs and RC4-128 provide deterministic test encryption; this is a parser-rejection fixture, not a recommendation to use obsolete encryption.

`npm run screenshots` starts a preview server if needed and captures eight actual app states plus an original generated social card. Only synthetic samples are used. Reports/traces, browser state and coverage are ignored. Never commit private data in screenshots/traces.

## Restricted cloud environment

A provided Chromium can be selected without weakening tests:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --project=chromium
```

A writable browser cache may be selected with `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright`; this is a tooling option, not an application variable. Downloading browsers requires official Playwright hosts allowed in environment settings. Do not disable TLS, checksum verification or assertions. Missing Firefox/WebKit are recorded as blocked/unrun, never passed.

`PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH` similarly selects a locally prepared WebKit launcher. In this cloud environment, Debian's signed package index and package hashes verified the additional native libraries, which were extracted into the downloaded browser's private library directories. This override avoids Playwright's system-only `ldconfig` lookup rejecting those private libraries; it does not skip any application tests. Firefox needs writable access to its browser profile configuration directory. CI uses the standard `playwright install --with-deps` installation instead of these environment-specific paths.

Manual screen-reader navigation, real mobile OS download UI and published-host checks cannot be inferred from automated desktop engine emulation. Keep those scopes explicit.
