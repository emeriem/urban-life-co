# AppDeploy production source reconciliation — 5 November 2026

## Decision

Reconcile the cumulative AppDeploy production snapshot **v34** into this repository without replacing GitHub-only engineering, documentation, CI, scripts, lockfiles, or source files that are not part of the AppDeploy snapshot.

- Repository: `emeriem/urban-life-co`
- GitHub baseline: `main` at `46a5d56b655ccccf7b381b283e2f33b5610b3b2b` (3 November 2026)
- AppDeploy application: `urban-life-co-zk9nyq`
- AppDeploy snapshot: `1793834371557` (v34, 4 November 2026 23:19:31 UTC)
- Snapshot inventory: 45 paths — 24 text/source files and 21 binary resources
- Reconciliation branch: `feature/ulc-corporate-refresh-2026-11-05`

This is a source-control reconciliation. It does not itself deploy or publish the application.

## Findings

### Confirmed common source

The following files were checked against GitHub `main` and are identical: `backend/index.ts`, `backend/community.ts`, `backend/registration.ts`, `backend/payment-provider.ts`, `package.json`, `postcss.config.js`, `public/events/urban-hikers-field-gallery.json`, `public/icon.svg`, `public/offline.html`, `src/main.tsx`, `src/ErrorBoundary.tsx`, `public/sw.js`, and `tailwind.config.js`.

The deployed community CSV export retains formula-injection protection for values beginning with whitespace followed by `=`, `+`, `-`, or `@`. The featured-story ordering and the live hero eyebrow fallback are also present in the deployed source. These reviewed GitHub fixes are therefore retained.

### AppDeploy production additions reconciled here

- `src/App.tsx`: the current parent-company homepage, Our Brands and Partnerships pages, their navigation, and local resource-backed image paths.
- `src/routing.ts`: explicit `brands` and `partnerships` routes.
- `src/assets.ts`: compatibility mapping from legacy GitHub-hosted image URLs to the app's local optimized assets.
- `src/index.css`: the deployed public-site styling, including portfolio and partnership page styling.
- `src/seo.ts` and `index.html`: current deployed SEO and social metadata.
- `tests/tests.json`: current deployed workflow coverage, including corporate brand and partnership discovery.
- `public/manifest.webmanifest`: the deployed icon set and PWA metadata.
- All 21 binary resources under `public/resources/`, including the logo, brand mark, app icons, social-sharing image, and 14 optimized WebP photos.

### Files intentionally not replaced

The deployed and GitHub copies of `src/vendor/qrcode-generator.ts` differ only at the chunk boundary/newline in the source read; the vendor implementation is retained from GitHub. All backend files checked are identical, so they are not rewritten.

GitHub-only files and capabilities remain intact. This reconciliation does not delete paths.

## AppDeploy version ledger

The 34 stored AppDeploy versions were inventoried. Timestamps below are UTC.

| Version | Snapshot ID | Created (UTC) |
|---:|---|---|
| v1 | 1792430984779 | 2026-10-19 17:29:44 |
| v2 | 1792703521091 | 2026-10-22 21:12:01 |
| v3 | 1792704330592 | 2026-10-22 21:25:30 |
| v4 | 1792704618558 | 2026-10-22 21:30:18 |
| v5 | 1792750414978 | 2026-10-23 10:13:34 |
| v6 | 1792750994107 | 2026-10-23 10:23:14 |
| v7 | 1792751210391 | 2026-10-23 10:26:50 |
| v8 | 1792751477629 | 2026-10-23 10:31:17 |
| v9 | 1792751735189 | 2026-10-23 10:35:35 |
| v10 | 1792752802576 | 2026-10-23 10:53:22 |
| v11 | 1792934512502 | 2026-10-25 13:21:52 |
| v12 | 1792936303790 | 2026-10-25 13:51:43 |
| v13 | 1792938016259 | 2026-10-25 14:20:16 |
| v14 | 1793032032368 | 2026-10-26 16:27:12 |
| v15 | 1793034090392 | 2026-10-26 17:01:30 |
| v16 | 1793035359281 | 2026-10-26 17:22:39 |
| v17 | 1793038200898 | 2026-10-26 18:10:00 |
| v18 | 1793070950226 | 2026-10-27 03:15:50 |
| v19 | 1793071069980 | 2026-10-27 03:17:49 |
| v20 | 1793309431487 | 2026-10-29 21:30:31 |
| v21 | 1793345699735 | 2026-10-30 07:34:59 |
| v22 | 1793351859576 | 2026-10-30 09:17:39 |
| v23 | 1793352178202 | 2026-10-30 09:22:58 |
| v24 | 1793352578051 | 2026-10-30 09:29:38 |
| v25 | 1793352847529 | 2026-10-30 09:34:07 |
| v26 | 1793353674127 | 2026-10-30 09:47:54 |
| v27 | 1793680257202 | 2026-11-03 04:30:57 |
| v28 | 1793682230151 | 2026-11-03 05:03:50 |
| v29 | 1793685132749 | 2026-11-03 05:52:12 |
| v30 | 1793689248399 | 2026-11-03 07:00:48 |
| v31 | 1793791322906 | 2026-11-04 11:22:02 |
| v32 | 1793792078293 | 2026-11-04 11:34:38 |
| v33 | 1793831723835 | 2026-11-04 22:35:23 |
| v34 | 1793834371557 | 2026-11-04 23:19:31 |

### Inventory milestones

- v1–v11: core React/Vite application and 14-path source inventory; edits during these versions were primarily within existing paths.
- v12: first separate Urban Life Co. logo resource appears.
- v27: routing, SEO and error-boundary modules appear.
- v28: Urban Hikers field-gallery data appears.
- v29: offline fallback page appears.
- v31: registration, payment-provider and community backend modules plus QR generator appear.
- v32: expanded image, brand, Open Graph and PWA icon resources appear.
- v33: asset URL compatibility helper appears.
- v34: parent-company portfolio and partnership pages, routes, styles and corresponding workflow coverage appear.

The ledger records all 34 stored version identifiers and the cumulative v34 source is reconciled here. It does not claim that every superseded intermediate snapshot has been replayed as a separate Git commit; historical experiments are not reintroduced over the current cumulative product.

## Release and operating rule

1. GitHub `main` is the reviewed source baseline.
2. Feature work is committed to a branch and reviewed before release.
3. AppDeploy is the production deployment target.
4. Before any AppDeploy release, the exact changed source and resource paths must be committed to GitHub.
5. After deployment, record the AppDeploy version ID in the corresponding GitHub release/reconciliation note.
6. Do not overwrite GitHub-only CI, security, backend, documentation or development infrastructure with an AppDeploy snapshot.

## Reconciliation outcome

The current cumulative production source and its binary resources are represented on the reconciliation branch. No production deployment was initiated by this source sync. The next commit on this branch is reserved for the approved public-site visual refresh.
