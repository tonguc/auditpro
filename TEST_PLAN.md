# AuditPro Test Plan

## Automated Checks

Run these before every delivery:

```bash
npm run test:launch-readiness
npm run launch:readiness
```

`launch:readiness` runs the full local launch gate in a fixed order. Keep the PostgreSQL integration test separate because it requires a disposable database URL:

Each `launch:readiness` run writes a JSON report under `launch-readiness-reports/` with the overall status, per-step durations, exit codes, and the failed script when the gate stops early. Set `AUDITPRO_LAUNCH_READINESS_REPORT_DIR` to write reports elsewhere.
Preflight also validates `AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS` so `/admin` can warn when the latest report is stale.
Preflight also validates `AUDITPRO_BACKUP_MAX_AGE_MS` so `/admin` can warn when the latest database backup is stale.
Set `AUDITPRO_REQUIRE_PDF_RENDER=true` in CI/hosting verification after installing Poppler so PDF raster rendering is mandatory.

```bash
AUDITPRO_INTEGRATION_DATABASE_URL=postgresql://user:password@localhost:5432/auditpro_test npm run test:integration:postgres
```

The optional PostgreSQL integration fixture applies every migration in an isolated schema, then verifies billing event idempotency, stale Stripe event protection, subscription deletion fallback without a price id, queued analysis job reclaim behavior, AI Visibility reservation/refund idempotency, durable AI accounting failure upserts, admin health database checks, and backup freshness.

Individual checks inside the launch gate:

```bash
npm run test:preflight
npm run test:migrations
npm run test:healthz
npm run test:docker-health
npm run test:admin-health
npm run test:admin-health-ui
npm run test:billing
npm run test:billing-sync
npm run test:billing-route
npm run test:stripe-webhook
npm run test:stripe-route
npm run test:security-rate-limit
npm run test:analysis-rate-limit
npm run test:security-headers
npm run test:csp-report
npm run test:operation-log
npm run test:operation-routes
npm run test:public-url
npm run test:analysis-route
npm run test:online-score
npm run test:access-policy
npm run test:pilot-ai-policy
npm run test:site-api-matrix
npm run test:analysis-job-route
npm run test:audit-route
npm run test:audit-authorization
npm run test:worker
npm run test:worker-operations
npm run test:backup-runbook
npm run test:backup-behavior
npm run test:seed-guard
npm run test:ai-visibility
npm run test:geo-positioning
npm run test:geo-publication-gate
npm run test:deployment-docs
npm run test:measurement-calibration
npm run test:rendered
npm run build
npm run test:runtime-security-headers
npm run test:admin-health-flow
npm run test:cloud-role-flow
npm run test:app-flow
npm run test:smoke
```

The cloud role browser flow verifies client handling of mocked cloud API save/delete responses for owner, member, and viewer roles. The browser app flow verifies that React hydrates, the demo audit loads, document views open, and no client-side errors occur. The smoke test verifies that the app renders and critical controls are present:

The admin health browser flow verifies `/admin` in a production server build, including empty-secret validation, authenticated refresh, launch actions, readiness sections, and desktop/mobile overflow checks.

- Load demo
- Export CSV
- Export MD
- Download PDF
- Evidence note fields
- Critical filter
- Report, Proposal, Presentation, Settings, QA views
- Analyze website control and private-network URL rejection
- GEO & AI Visibility is the first audit pillar and includes prompt, citation, source-readiness, and authority evidence.
- Viewer cloud mutations return mocked `403` responses while the local audit remains restored; owner and member cloud save/delete mocked responses succeed.
- Audit route fixtures verify malformed audit JSON returns `400`, viewer mutations return `403` before body parsing, and valid cloud save/delete handlers preserve `no-store` responses.

## Manual Test Flow

1. Open `http://localhost:3000`.
2. Click `Load demo`.
3. Confirm score, coverage, confidence, and top issues update.
4. Start a new audit, enter a public domain, and click `Analyze website`.
5. Switch through English, Turkish, German, Arabic, Simplified Chinese, French, and Spanish.
6. Confirm navigation, audit controls, filters, score labels, and workflow controls translate.
7. Select Arabic and confirm the document uses right-to-left layout.
8. Select another language, reload, and confirm the preference is retained.
9. Confirm the scan summary shows the automated check count and analyzed page count.
10. Expand `View analyzed pages` and confirm up to 25 same-origin pages are listed.
11. Confirm the audit is automatically saved and evidence notes begin with `Automated check:`.
12. Change several checkpoints across categories.
13. Add evidence notes to failed or partial findings.
14. Assign an owner, due date, and delivery status to a failed finding.
15. Attach PNG, JPEG, WEBP, or GIF screenshot evidence to a failed or partial finding; oversized screenshots above 200 KB should be rejected.
16. Save and reload; confirm workflow values and screenshot evidence return.
17. Save the audit.
18. Select the saved audit from the sidebar.
19. Duplicate the audit and confirm the copy is blank.
20. Reset the copy and confirm checklist and workflow state clear.
21. Delete the copy.
22. With a viewer account, confirm cloud save/delete returns `403`, includes `x-auditpro-request-id`, and the audit is restored locally after a denied cloud delete.
23. With a member account, confirm cloud save/delete succeeds.
24. Open `Report`, `Proposal`, `Presentation`, `Settings`, and `QA`.
25. Add agency name, booking URL, brand color, and agency logo.
26. Add a client logo.
27. Export CSV and confirm findings, owner, due date, implementation status, and screenshot evidence are present.
28. Export Markdown and confirm report, workflow sections, and screenshot evidence status are present.
29. Download PDF and confirm report sections are present.
30. Export JSON backup.
31. Clear all audits.
32. Import the JSON backup and confirm the audit returns.

## Client-Ready Acceptance Criteria

- Report readiness shows `Client-ready` only when audit coverage is high.
- Every client-facing report includes executive summary, category analysis, quick wins, strategic fixes, detailed findings, and 30-60-90 plan.
- Findings include priority, status, impact/effort lane, recommended action, and evidence note when supplied.
- CSV export can be used as an implementation backlog.
- Failed and partial findings retain owner, due date, and delivery status after save/reload and in CSV/Markdown exports.
- Failed and partial findings can retain PNG, JPEG, WEBP, or GIF screenshot evidence up to 200 KB after save/reload and in CSV/Markdown/JSON exports.
- Markdown export can be reviewed or edited outside the app.
- PDF export can be sent as a first client-facing draft after visual review, with tabled score, roadmap, and priority issue sections. When `pdftoppm` is available, the browser flow also raster-renders exported PDFs and checks that the first page is nonblank. With `AUDITPRO_REQUIRE_PDF_RENDER=true`, missing `pdftoppm` fails the gate.
- Automated scanning rejects local/private addresses, pins crawler fetches to public DNS resolutions, follows at most four redirects, reads at most 25 standard-mode pages in batches of five, and rate-limits repeated scans by client and domain.
- Authenticated analysis jobs reserve requested pages before queueing, then reconcile unused pages after completion or refund the reservation after failure.
- Page usage is accounted through `usage_monthly` plus `analysis_jobs` reconciliation; `credit_ledger` is reserved for AI prompt/response credits only.
- AI Visibility reserves monthly report/prompt/response allowances before model calls, treats AI credit reservations as idempotent by reference id, refunds unused prompt/response credits after partial or failed observations, and idempotently returns the monthly report slot when a reserved scan produces no successful report.
- Core audit UI supports English, Turkish, German, Arabic, Simplified Chinese, French, and Spanish; Arabic renders RTL and language preference persists.

## Known Follow-Ups

- Replace mocked cloud-role browser coverage with real hosted auth sessions during hosting verification.
- Install Poppler in CI/hosting verification and run the launch gate with `AUDITPRO_REQUIRE_PDF_RENDER=true`.

Measurement calibration: npm run test:measurement-calibration exercises valid and deliberately invalid HTML fixtures through the production measurement functions. Retired and uncalibrated controls must not affect scores; browser contrast and accessible-name fixtures run in npm run test:rendered. These are bounded sample checks, not validation of ranking, conversions, full accessibility, or AI visibility. Both are mandatory in npm run launch:readiness.

