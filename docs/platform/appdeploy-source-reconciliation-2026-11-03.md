# AppDeploy Source Reconciliation — 3 November 2026

## Purpose

Restore GitHub as a reviewable, faithful text-source baseline for the known-good AppDeploy snapshot before Phase 3 implementation. This is a source reconciliation, not a production release.

## Sources compared

- AppDeploy application: `urban-life-co-zk9nyq`
- AppDeploy snapshot: `1793689248399` (stored version v30)
- GitHub repository: `emeriem/urban-life-co`
- GitHub comparison baseline: `main`
- Reconciliation branch: `reconcile/appdeploy-source-2026-11-03`

## Result

Four tracked text files differed materially and were copied from the selected AppDeploy snapshot into this branch. A fifth file, `src/routing.ts`, contained a duplicate `contact` declaration in the deployed snapshot; it was corrected rather than copied verbatim so the reconciled branch has a valid TypeScript route map:

| File | AppDeploy snapshot | GitHub main before reconciliation | Action |
|---|---:|---:|---|
| `backend/index.ts` | 1,097 lines | 1,067 lines | Reconciled |
| `src/App.tsx` | 2,962 lines | 2,840 lines | Reconciled |
| `src/index.css` | 5,897 lines | 3,088 lines | Reconciled |
| `src/routing.ts` | 100 lines | 100 lines | Duplicate `contact` entry removed after CI identified TS1117 |
| `tests/tests.json` | 132 lines | 131 lines | Reconciled |

The following tracked text files were identical at comparison time:

- `index.html`
- `package.json`
- `postcss.config.js`
- `public/events/urban-hikers-field-gallery.json`
- `public/icon.svg`
- `public/manifest.webmanifest`
- `public/offline.html`
- `public/sw.js`
- `src/ErrorBoundary.tsx`
- `src/main.tsx`
- `src/seo.ts`
- `tailwind.config.js`
- `tsconfig.json`
- `vite.config.ts`

The AppDeploy resource inventory separately lists `public/resources/urban-life-logo.png`. Resource assets are managed separately from the text-source snapshot and were not rewritten by this reconciliation. Confirm the asset's repository tracking and integrity during the PR review.

## Phase 3 baseline confirmed in deployed source

The deployed source currently has event fields `registrationLink` and `capacity`, but no registration/payment domain implementation was found in the source search. In particular, no payment or waitlist routes/state model were found. The event detail currently renders an external registration link when configured.

The initial Phase 3 design is maintained separately on `phase-3/registration-payments-design`. Approved scope remains:

- Automated bank transfer
- USSD, subject to provider/bank support proven in sandbox
- Manual bank-transfer fallback, with administrator verification against actual bank credit
- No card collection or card payment in the initial checkout
- Provider-neutral payment adapter until sandbox evaluation selects a provider

## Verification and limitations

- This work reads and updates GitHub source only; it does not call AppDeploy deployment, publish, or production configuration actions.
- No live application routes, production payment settings, secrets, or bank details were changed.
- The AppDeploy SDK reference confirms the database SDK documents atomic multi-record transactions, conditional updates, chosen IDs, and atomic increments. This does not by itself prove application-level capacity allocation is correct; implementation must use the documented contract and test concurrency, duplicate requests, conflict handling, and unknown transaction outcomes.
- AppDeploy storage supports path-based writes, reads, listing and signed URLs. Secure manual-payment evidence access still needs explicit authorization and retention controls.
- The repository CI workflow runs frontend type-checking, production build, and backend/API contract checks on pull requests targeting `main` or `develop`. CI results must be inspected after the draft PR is opened.
- No end-to-end browser or payment sandbox tests have been run as part of this source reconciliation.
- The previous architecture audit's route/data inventory is dated 26 October 2026 and should be refreshed against this reconciled source before feature implementation.

## Release guardrail

This branch is for review only. Do not merge or deploy it without explicit approval. The user's standing instruction remains: **no deployments until explicitly requested**.


## CI findings after opening the draft PR

The first GitHub Actions run identified two TypeScript errors in the reconciled source:

- `src/App.tsx`: the navigation helper accepted `string`, but the page-state setter requires a `StaticPage | DetailPage` value. The helper parameter is now typed as `StaticPage`.
- `src/routing.ts`: duplicate `contact` entries existed in the static-page union and route map. The duplicate declarations were removed.

The build and backend/API contract steps were skipped because type-checking failed first. The fixes were committed after that run. After correcting the navigation menu item array and the two component callback signatures to use `StaticPage`, GitHub Actions run [41599668158](https://github.com/emeriem/urban-life-co/actions/runs/41599668158) completed successfully for commit `ea3225f9b999ab53f76c328e386d21b4cf80ff1f`. The frontend type-check, production frontend build, and backend/API contract checks all passed on that commit. The report-only update that records this result does not change application source; its own CI run is tracked separately.

