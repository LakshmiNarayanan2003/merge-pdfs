# Changelog

Uses [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and semantic versioning.

## [0.1.0] - 2026-10-17

### Added

- Browser-local PDF page copying/merging with PDF.js previews and pdf-lib worker output.
- Document reorder, exact cross-document page order, page ranges, rotation, selection editing, remove/restore and one-step page undo.
- Picker/drop/add-more, per-file validation, resource safeguards, progress/cancellation, sanitized naming and validated downloads.
- Original generated sample documents and deterministic PDF edge fixtures.
- Responsive PDF2Pix sibling design, light/dark modes, semantic keyboard controls and privacy/feature documentation.
- Unit/component/output tests, browser/privacy/axe checks, screenshots, static checks, CI and GitHub Pages deployment configuration.

### Security

- No upload/backend/account/analytics/telemetry/storage; same-origin workers/render assets and restrictive CSP.
- Interactive annotations/actions/widgets excluded from output; encrypted merging rejected honestly.
- Bounded previews, cancellation and object-URL/document cleanup.

### Limitations

- No encrypted merge, form/link/annotation/bookmark/signature preservation, duplicate/crop/compression or guaranteed full offline support.
- See [verification](docs/VERIFICATION.md) for actual executed checks and deployment state; configuration is not evidence of publication.
