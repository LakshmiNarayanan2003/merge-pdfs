# Security

Supported development version: PDFMerge 0.1.x. Use an updated browser and keep dependencies current.

## Threat model

Untrusted PDF bytes are parsed by PDF.js and pdf-lib locally. Extension/MIME/signature validation is a usability boundary, not a malware scanner. Malformed images/fonts/compressed streams may exploit parser bugs or exhaust browser memory despite caps. No server fallback exists. A compromised browser, extension, dependency, build pipeline or hosting account can violate the application's intended boundary.

The app uses the PDF.js display API for canvas rendering only: no scripting manager, sandbox script engine, annotation DOM or form/action execution is instantiated. XFA is disabled. In PDF.js 6 the historical isEvalSupported loading option is absent; no unsupported option is pretended to provide protection. The script CSP disallows JavaScript eval and inline scripts. Local WASM compilation is permitted for PDF.js codecs.

Page actions, annotations, link actions and form widgets are removed before copying. A new output catalog omits source OpenAction, attachments and document-level JavaScript. Deterministic active-content/form fixtures verify these explicit keys are absent from output and that input JavaScript never executes in the app. This is **not a comprehensive PDF sanitization guarantee**; keep untrusted downloads subject to your normal reader/endpoint protections.

## Controls

- Byte-only user loading; same-origin worker/font/CMap/WASM paths, never PDF-chosen remote URLs.
- Restrictive meta CSP: self-only scripts/connections/workers, no objects/frames/forms, local blob/data images/fonts. Inline styles and WASM compilation are narrowly retained for rendering. Meta CSP cannot set frame-ancestors.
- No raw HTML injection, document data persistence, logs of raw parser errors or runtime third-party endpoints.
- Safe download filenames; fresh Creator/Producer metadata with no source paths or identifiers.
- 20-file, 100 MB/file, 500 MB total, 1000 source-page caps, bounded thumbnails and cancellable merge worker. Resource caps do not bound all PDF decompression.
- Encrypted files rejected; ignoreEncryption is never enabled. No password collection.
- Lockfile, package integrity/TLS verification, dependency audit and Dependabot. An audit is a point-in-time advisory check, not proof of safety.

Digital signatures are not preserved. Editing/merging signed PDFs generally invalidates their signatures. PDF accessibility tags, archival conformance and advanced interactive structures are not guaranteed.

## Reporting

Use GitHub **Security → Report a vulnerability** if private reporting is enabled. Otherwise contact the maintainer privately through a method on their GitHub profile. Do not post sensitive PDFs or exploit details in a public issue. Send a minimal synthetic reproduction with browser/build versions. No response SLA or security certification is promised.

[Privacy](PRIVACY.md) · [PDF support](docs/PDF_SUPPORT.md) · [Verification](docs/VERIFICATION.md).

The development-only Vite server permits its React refresh preamble and HMR WebSocket. Production builds retain the stricter CSP tested by the browser suite. Development tooling never receives user PDF bytes.
