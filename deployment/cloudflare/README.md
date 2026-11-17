# Cloudflare Pages + D1 (experimental free deployment)

**No live site is provisioned by committing these files.** Test access from mainland China before collecting participants.

## Cloudflare Pages configuration
- Connect GitHub repository `Qianru-code/credibility-lab-study`
- Framework preset: None
- Root directory: repository root
- Build command: `node deployment/cloudflare/build-pages.cjs`
- Build output directory: `dist`
- Functions: Cloudflare Pages reads `functions/api/*.js` at repository root (committed separately; build scripts cannot reliably generate Functions after discovery).
- Create D1 database `credibility-lab-study` in Cloudflare dashboard.
- Apply `deployment/cloudflare/schema.sql` using D1 console or `wrangler d1 execute <database> --file=deployment/cloudflare/schema.sql --remote`.
- Pages project > Settings > Bindings: add D1 binding named `DB` to that database for production and preview.
- Pages project > Settings > Variables and Secrets: set encrypted `ADMIN_TOKEN` (at least 32 random characters). Do not expose it to frontend or GitHub.
- Redeploy. Confirm `/api/submit` accepts a test form and `/api/export` denies unauthorized access.

## Important caveat about the frontend bundle
The build script patches the existing minified training-export handler. It downloads the JSON backup and tries to POST the training record. This is intentionally a minimal change, but it is fragile if the React bundle is rebuilt; the build script fails rather than silently omitting upload.
The participant must set profile display name to the participant code before training export.

## Data protection
Obtain ethics approval and assess China-to-overseas data transfer before collecting actual responses. Keep only pseudonymous codes; avoid names and personal content in free text. Limit exports to approved researchers, define retention and withdrawal processes, and regularly export an encrypted backup. D1 data is not a substitute for an independent backup.

## Pilot test
1. Verify static assets, form A, form B, questionnaire and social feed.
2. Submit each form with a test code, check a 32-char receipt.
3. In social feed, set display name to test code, complete two training tasks, click Activity download; confirm upload receipt AND downloaded JSON.
4. Use `curl -H "Authorization: Bearer <secret>" https://<your-domain>/api/export` from a trusted device and verify all records.
5. Repeat on China Mobile, Unicom, Telecom, and different phone browsers.
6. If any mainland network cannot reliably open the site, do not recruit there until a tested alternative is ready.

The original GitHub Pages site is not changed by the build script. The `dist` folder is a deployment output, not research data.
