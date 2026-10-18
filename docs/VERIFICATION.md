# Verification record

Observed locally on **2026-10-17**, with final checks repeated on **2026-10-18**. This records executed checks, not hypothetical CI or publication success.

## Machine and tools

- Debian GNU/Linux 13 (trixie), Linux x86_64.
- Node **24.19.0 LTS**, npm **11.9.0**.
- Playwright **1.64.1** using system **Chromium 154.0.8037.57**. The pinned Playwright Chromium binary was not downloaded; these results explicitly use the installed system browser.
- Downloaded Playwright Firefox **157.0** (build 1555) and WebKit **27.2** (build 2370).
- React/React DOM 19.3.1, TypeScript 6.0.3, Vite 8.3.4, PDF.js 6.4.299, pdf-lib 1.17.1, Vitest 5.0.5. Exact transitive versions/integrity are in the lockfile.

## Passed

| Check                         | Observed result                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean dependency installation | `npm ci` completed successfully from package-lock.json.                                                                                                                                                                                                                                                                                         |
| Fixture generation            | Original samples and edge corpus generated successfully. SHA-256 values reproduced after regeneration for samples A/B/C, large and active-content fixtures; the committed encrypted fixture was retained unchanged.                                                                                                                             |
| Unit/state/validation         | **49 passed**, 0 failed/skipped.                                                                                                                                                                                                                                                                                                                |
| PDF merge engine              | **15 passed**, 0 failed/skipped. Includes exact B2/A1/C1/A3 order, PDF.js selectable-text extraction, boxes, rotation, metadata, encryption/corruption rejection and excluded interactive structures.                                                                                                                                           |
| React components              | **16 passed**, 0 failed/skipped. Includes document/page undo consistency regression.                                                                                                                                                                                                                                                            |
| Total Vitest                  | **80 passed** across 3 files, 0 failed/skipped.                                                                                                                                                                                                                                                                                                 |
| Chromium production E2E       | **21 passed**, 0 failed/skipped. Real downloaded PDFs parsed; no size-only merge assertions.                                                                                                                                                                                                                                                    |
| Firefox production E2E        | **21 passed**, 0 failed/skipped, after granting browser-profile directory access.                                                                                                                                                                                                                                                               |
| WebKit production E2E         | **21 passed**, 0 failed/skipped, using verified Debian native libraries in the browser's private library directories.                                                                                                                                                                                                                           |
| Total Playwright              | **63 passed** across the three engines (21 per engine), plus the separate alternate-base Chromium smoke test.                                                                                                                                                                                                                                   |
| Alternate base                | `/alternate/` production build and actual three-sample merge/download smoke test passed (1 additional Chromium test). Default `/merge-pdfs/` build restored.                                                                                                                                                                                    |
| Output visual check           | Original and reopened merged page render to identical intrinsic thumbnail RGBA pixels. A previous DOM screenshot comparison exposed subpixel layout sampling; intrinsic PDF render pixels provide the comparison independent of layout.                                                                                                         |
| Accessibility                 | Axe found **0 violations** in tested empty/light/dark/document/page/result and mobile states. Keyboard skip/reorder controls exercised. This is not formal WCAG certification.                                                                                                                                                                  |
| Responsive workflows          | 1440×900, 1280×800, 768×1024, 390×844 in both themes; no horizontal overflow, real edits/merge/download verified.                                                                                                                                                                                                                               |
| Privacy/network               | All observed user-file requests were expected same-origin static GETs without bodies; no sentinel filename/content, third-party endpoint, PDF script execution, CSP violations, browser storage or service worker creation.                                                                                                                     |
| Cancellation/resources        | Pending sample fetch cancelled; 500-page file paginates to 12 cards and merge cancellation recovers. Oversized input and 21st-file safeguards exercised. Stale download URLs revoked and refresh clears inputs.                                                                                                                                 |
| Development server            | Actual Vite development server loaded all samples and produced the real merged result without page errors. HMR has a development-only CSP relaxation; production CSP remains strict.                                                                                                                                                            |
| Static/quality                | TypeScript, ESLint, Prettier, production build, static CSP/privacy/asset checks and documentation-link checks passed.                                                                                                                                                                                                                           |
| Screenshots                   | Eight real UI states generated in docs/images, plus original public/social-preview.png.                                                                                                                                                                                                                                                         |
| npm audit                     | Full and production-only audits each reported **0 vulnerabilities**.                                                                                                                                                                                                                                                                            |
| Dependency/license review     | Unused Tailwind/JSZip and unused PNG TypeScript declarations excluded. All installed production license families are MIT, ISC, Apache-2.0, 0BSD or MIT/Zlib, with notices retained by the build.                                                                                                                                                |
| Repository audit              | Relevant TODO/FIXME/HACK/debugger/suppression/injection/credential/URL matches inspected. Test doubles occur only in component tests; hostile URLs only in generated security fixtures; loopback URLs only in development/test tooling; public links point to project/docs/sibling tool. No unfinished core action or production logging found. |

`npm run check` is the passing deterministic gate. Vitest V8 coverage covers all source modules except bootstrap/test setup/types; browser integration modules appear uncovered in this **unit** report because actual browser tests exercise them separately. Coverage is recorded in ignored coverage output, not represented as 100%.

## Environment fixes

The first cross-browser run on October 18 passed all 21 Chromium cases but had 42 browser-launch failures: Firefox could not write its profile configuration directory and WebKit lacked native libraries. Firefox passed after narrowly scoped execution permission was granted. WebKit passed after missing libraries were downloaded through Debian's signed apt package index, hash-verified by apt, and extracted into the downloaded browser's private `sys/lib` directories. The explicit WebKit executable option selects that prepared launcher because Playwright's default system-only `ldconfig` check cannot discover private libraries. No application test, assertion, TLS check or package verification was disabled. Standard CI installs system dependencies with Playwright.

## Blocked / not verified

- **Local Chromium variant:** local results use system Chromium 154, not the pinned downloaded build. Its initial download was blocked by the proxy; GitHub Actions subsequently installed its pinned browsers and passed the complete suite.
- **Real assistive technology / devices:** no manual screen-reader assessment or physical iOS/Android OS download interaction was performed. Desktop engine viewport emulation is not a physical-device guarantee.
- **PDF scope:** no encrypted merging, annotation/form/link/bookmark/signature preservation, PDF/UA/PDF-A certification, comprehensive sanitization or universal complex-PDF fidelity guarantee. Exact behavior is in [PDF_SUPPORT.md](PDF_SUPPORT.md).

## Published verification

The application commit [`daa3ed7`](https://github.com/LakshmiNarayanan2003/merge-pdfs/commit/daa3ed7d0b48d5531e66ee64a6a472fb471ab1b4) was pushed to `master` on October 18. Both [CI](https://github.com/LakshmiNarayanan2003/merge-pdfs/actions/runs/39113257786) and [Pages deployment](https://github.com/LakshmiNarayanan2003/merge-pdfs/actions/runs/39113258099) completed successfully. The deployment's reusable verification job passed dependency installation, fixtures, deterministic checks, audit, pinned browser installation, all browser tests, coverage, screenshots and the alternate-base smoke check before deployment.

The public [PDFMerge site](https://lakshminarayanan2003.github.io/merge-pdfs/) passed an additional real Firefox browser smoke test: three bundled samples loaded, merged output downloaded, all eight page labels parsed in exact A1/A2/A3/B1/B2/C1/C2/C3 order, filename `merged.pdf`, zero page errors and only same-origin requests. This live-host smoke is additional to the 63 local browser cases.

The environment's HTTPS proxy CA was trusted only inside a temporary Firefox test profile. Certificate validation remained enabled, and no persistent browser trust store was changed. GitHub API and live-site connectivity were available by this final check. This documentation update records the already verified application commit; it does not change application code.

## Reproduce

```sh
npm ci
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --project=chromium
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run screenshots
npm audit --audit-level=moderate
```

For full browser verification in a standard environment:

```sh
export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright
npx playwright install --with-deps chromium firefox webkit
npm run check:full
```

The prepared cloud browser cache can instead be used with `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` and `PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH=/workspace/.cache/ms-playwright/webkit-2370/pw_run.sh`. Firefox also requires permission to write its profile configuration directory.

The application itself needs no environment variables or credentials. Browser-cache/executable options above configure test tooling only. No tests or assertions were disabled to bypass a failed prerequisite. [Testing procedures and scope](TESTING.md).
