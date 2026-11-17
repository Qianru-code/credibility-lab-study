# Mainland China deployment and automatic data collection

## Status
This directory contains a **new backend implementation**, not a live deployment.
Existing GitHub Pages and the current form endpoint are unchanged until migration is tested.

## Recommended hosting
Use one low-cost Hong Kong VPS with Python 3.9+, Nginx/Caddy HTTPS, a custom domain and persistent disk.
Mainland China connectivity MUST be tested on China Mobile, Unicom and Telecom networks.
For mainland-hosted sites, check ICP requirements. Do not use pages.dev as a guaranteed mainland solution.

## Launch collector
1. Copy `deployment/collector.py` onto the server, outside the public web directory.
2. Create a dedicated unprivileged system user and persistent directory with restrictive permissions.
3. Set `ALLOWED_ORIGIN=https://your-study-domain.example`, `ADMIN_TOKEN` to a long random secret,
   `DATA_DIR=/var/lib/credibility-lab`, and run `python3 collector.py`.
4. Configure HTTPS reverse proxy to `127.0.0.1:8765`. Expose only ports 80/443.
5. Set up encrypted, off-server backups of the SQLite database and a retention/deletion schedule.
6. Check university ethics approval and cross-border transfer requirements before collecting real participant responses.

## Integrate existing forms
In `study/submission.js`, replace the current hard-coded fetch URL with
`https://your-study-domain.example/submit` (or `/submit` if served on the same origin).
Do this only after the server is live. Keep the current JSON download as fallback.
A successful receipt confirms the server committed the response to SQLite.
Do not put ADMIN_TOKEN in any browser-side code.

## Training activity
The social feed is a compiled static JS bundle. Its exact activity export schema needs
inspection before wiring automatic upload. Preserve the existing Activity JSON download
until a verified adapter is implemented. The collector accepts records with
`participant` plus a `training`, `activity`, or `recordType: "training"` field.

## Test checklist
- Submit Form A and B with different stages, confirm receipt and SQLite record.
- Submit questionnaire; confirm linked participant code.
- Retry identical POST; confirm no duplicate.
- Simulate lost network; confirm backup JSON still downloads.
- Check admin export requires bearer token; never publish database or token.
- Test phone/desktop in mainland China on multiple mobile networks.
- Verify withdrawal/deletion workflow, data minimization, consent and debriefing.
- Do not run actual study until a pilot confirms end-to-end collection.

## Export for researcher
`curl -H "Authorization: Bearer $ADMIN_TOKEN" https://your-study-domain.example/admin/export`
Only run from a trusted device; store exports securely.
