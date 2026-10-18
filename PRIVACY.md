# Privacy

PDFMerge 0.1.0 is a static, browser-local application. **Your PDFs never leave your device.** No backend, upload endpoint, account, analytics, telemetry, database, advertising, conversion API or API keys exist in this project.

## Exact data flow

1. Select PDF files using the picker/drop. Browser File objects remain local.
2. Read bytes into browser memory; validate the signature and resource limits.
3. PDF.js parses local bytes in its bundled worker. No user-supplied URL is passed to the parser.
4. Bounded canvases render lazy thumbnails locally. Blob previews are cached in memory only.
5. A dedicated merge worker reads the selected File objects locally and uses pdf-lib to copy pages from the current page model. There is no raster-to-PDF conversion.
6. Output is generated and reopened in memory. The signature, page count and first-page PDF.js operator list are checked.
7. A local Blob/Object URL supplies a user-initiated PDF download.
8. Stale result URLs are revoked after edits. Preview URLs/render tasks are released on unmount; document workers/cache references are released on remove, clear or navigation. Merge cancellation terminates its worker. JavaScript garbage collection controls final reclamation.

No bytes or document data are written to localStorage, sessionStorage, IndexedDB, cookies or Cache Storage. There is no service worker. Even theme choice is session-only. Refresh clears selected files. Encrypted inputs are rejected and no password is requested or retained.

## Network boundary

HTML, JavaScript, CSS, icons, PDF.js workers, fonts, CMaps and WASM are same-origin static resources. No remote fonts or runtime CDN are used. The sample button intentionally fetches the project's public samples from the same host; this is separate from local user files. Standard font/CMap asset choices can reveal which generic renderer resource was required, not uploaded PDF content or arbitrary document metadata.

GitHub Pages and network providers can see ordinary website asset requests, IP addresses and connection headers. Clicking GitHub or PDF2Pix navigates outside the application but includes no session data. No PDF-provided links or JavaScript are executed. Filenames are React text, never HTML or URL parameters.

The meta CSP restricts requests/scripts/workers to self, blocks object/frame embedding and forms, and allows only local blob/data image/font resources. WASM compilation and inline styles needed by browser/PDF.js rendering are allowed; JavaScript eval/inline scripts are not. A meta CSP cannot enforce frame-ancestors; GitHub Pages lacks custom response header configuration.

## Honest limits

Browser extensions may inspect pages. Browsers, operating systems, developer tools, downloaded files, screenshots, swap/pagefiles and compromised dependencies/hosting are outside application control. JavaScript cannot securely wipe browser memory byte-for-byte. Downloaded files persist on your device normally. Limits reduce resource risk but do not make malicious documents safe. No universal security or privacy proof is claimed.

The browser privacy test records page/worker requests, permits only expected same-origin static GETs without bodies, and searches for a sentinel filename/content. It also checks no browser storage or service worker registrations are created. Results apply to the tested build/fixtures; see [verification](docs/VERIFICATION.md).

The development-only Vite server permits its React refresh preamble and HMR WebSocket. Production builds retain the stricter CSP tested by the browser suite. Development tooling never receives user PDF bytes.
