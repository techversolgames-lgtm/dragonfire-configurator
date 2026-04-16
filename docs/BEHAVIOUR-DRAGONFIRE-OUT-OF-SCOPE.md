# Out-of-scope changes (user-approved)

Edits to files outside the DragonfireTools scope are listed here. Each entry was approved by the user before the change and documented after.

| Date       | File(s) | Reason |
| ---------- | ------- | ------ |
| 2025-03-06 | `package-lock.json` (deleted), `package.json` | Use only Yarn: removed npm lockfile, added `packageManager` field. |
| 2025-03-10 | `src/components/dom/CustomSidebarSubComponents/CustomRange.jsx` | Add inches ("in") support for Measurement Units so DragonfireTools sidebar can show/edit wall height and width in inches. |
| 2025-03-17 | `src/components/canvas/NavCube.jsx` | Add optional `leftOffset` prop so DragonfireTools can push the NavCube right and avoid overlap with the left icon panel. |
| 2026-03-25 | `package.json`, `src/pages/api/send-dragonfire-quote.js` | SendGrid: server route to email Dragon Fire quote PDFs with dynamic template; add `@sendgrid/mail`. Configure `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_DRAGONFIRE_QUOTE_TEMPLATE_ID` (and optional `SENDGRID_DRAGONFIRE_QUOTE_BCC`) on Vercel / `.env.local`. |
| 2026-03-25 | `src/pages/api/send-dragonfire-quote.js` | 503 response includes `missingEnv` + `hint` when SendGrid env is unset (helps Vercel: redeploy / empty values / wrong project). |
