# Deployment

Repository: `LakshmiNarayanan2003/merge-pdfs`, branch `master`. GitHub Pages target derived from the actual repository: `https://lakshminarayanan2003.github.io/merge-pdfs/`. This target is not a claim that publication has occurred. No custom domain or paid service is required.

`ci.yml` runs on push/PR/workflow_call with read-only contents permission. It installs the lockfile, regenerates fixtures, runs check/coverage/audit/all three browser engines/screenshots and uploads the default production build as `verified-site`. An alternate `/alternate/` smoke check runs afterward, so it cannot replace the production artifact.

`deploy.yml` runs on pushes/manual dispatches on master, waits for reusable CI, downloads that exact verified artifact and deploys it using configure-pages/upload-pages-artifact/deploy-pages. Only the deployment job receives pages:write and id-token:write, using the github-pages environment and serialized concurrency. PRs cannot deploy.

Enable **GitHub Actions** under Settings → Pages → Build and deployment when repository administration is available. No personal access token or application secret is required. Observe remote workflow success and test the real public sample/merge/download path before claiming the public release is live.

## Base and assets

Vite defaults to `/merge-pdfs/`. Worker URLs, samples, favicon and PDF.js CMaps/fonts/WASM use the base. Deploy the entire dist directory, including licenses. The optional build-time override is `VITE_BASE_PATH`; no application environment configuration is needed for normal deployment. Canonical/sitemap/OG URLs identify the actual repo's Pages target.

```sh
VITE_BASE_PATH=/alternate/ npm run build
VITE_BASE_PATH=/alternate/ npm run test:e2e -- --project=chromium --grep 'three bundled samples'
# Stop previous preview processes before changing base; restore the default build afterward.
npm run build
```

## Cloud environment

Use the existing `/workspace/merge-pdfs` checkout; tasks are isolated, so do not create worktrees unless explicitly requested. `npm ci` and `npm run build` restore dependencies/assets. Runtime processes must restart in future tasks: use `npm run dev` for development or `npm run preview -- --port 4173 --strictPort` for production tests. A successful sample download parsed by Playwright is a readiness check; a PID alone is not.

Prepared dependencies/files may be snapshotted after reviewing/saving environment settings and publishing the cloud environment. A saved draft alone neither executes setup nor publishes. Browser install hosts must be allowed when refreshing Playwright binaries. [Verification](VERIFICATION.md) distinguishes local checks, unavailable prerequisites and publication.
