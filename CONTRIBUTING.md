# Contributing

Use Node 24 LTS, `npm ci`, then `npm run dev`. Before submitting: `npm run format`, `npm run check:full` after Playwright installation. See [testing](docs/TESTING.md).

Keep user data local, use generated public fixtures, preserve accessible alternatives to dragging, and test actual PDF output. Do not add analytics, runtime CDNs, hidden uploads, unsafe HTML or browser persistence of files. Explain feature-preservation limitations. Report security issues privately per [SECURITY.md](SECURITY.md).

Small focused PRs should describe behavior, tests actually run, screenshots for UI changes and any compatibility/security tradeoffs. Do not update expected output merely to hide failures. MIT contributions; treat contributors respectfully.
