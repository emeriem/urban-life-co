# Staging-to-GitHub Source Reconciliation — 3 November 2026

## Decision

GitHub `main` is the newer and more complete source baseline. The AppDeploy staging snapshot predates the latest changes on `main` and contains no unique functional implementation that should be copied over the current GitHub source. The reconciliation branch was therefore fast-forwarded to `main`; no application source files were overwritten.

This is a GitHub source-control reconciliation only. No AppDeploy deployment, publish, or production action was performed.

## Revisions compared

- Repository: `emeriem/urban-life-co`
- GitHub `main`: `906e0be2fa28213147a9c2cfb4c9440743890311` (3 November 2026, 11:29:37 UTC)
- AppDeploy staging app: `urban-life-co-staging-nqrz5n`
- AppDeploy staging snapshot: `1793700033976` (3 November 2026, 10:00 UTC)
- Reconciliation branch before update: `ec5aa56e40e22332d036e8e0809f464640b5e891`
- Branch comparison before update: zero commits ahead of `main`, three behind; the branch head was the merge base.
- Reconciliation action: fast-forwarded `reconcile/staging-source-2026-11-03` to `906e0be2fa28213147a9c2cfb4c9440743890311` without force.

## Findings by source area

| Area | Staging snapshot | GitHub `main` | Reconciliation decision |
|---|---|---|---|
| `src/App.tsx` | 4,423 lines | 3,447 lines | Keep GitHub `main`. The staging snapshot predates the latest featured-story fallback, hero eyebrow, and CSV formula-injection fixes recorded in PR #32. Differences are otherwise predominantly formatting/line wrapping. |
| `backend/index.ts` | 1,246 lines | 1,119 lines | Keep GitHub `main`. Staging contains a clearly labelled mock checkout event fixture; it is staging test data and must not be promoted into the main application source. Staging also uses a larger seed lookup limit. |
| `backend/registration.ts` | 1,695 lines | 695 lines | No substantive behavior delta identified in token-level comparison; differences are predominantly formatting. Keep the newer reviewed GitHub version. |
| `backend/payment-provider.ts` | 437 lines | 347 lines | No substantive behavior delta identified in token-level comparison; differences are predominantly formatting. Keep the newer reviewed GitHub version. |
| `backend/community.ts` | 188 lines | 96 lines | No substantive behavior delta identified in token-level comparison; differences are predominantly formatting. Keep the newer reviewed GitHub version. |

PR #32 is already part of `main` and records the relevant latest source changes:
- Restore the featured-story fallback and featured-story editing/display behavior.
- Align the fallback hero eyebrow with the live AppDeploy wording.
- Correct the CSV formula-injection protection pattern.

## Repository completeness

The AppDeploy staging snapshot contains 18 source paths; it is not a complete mirror of the GitHub repository. GitHub also contains files and directories that are not part of that AppDeploy text-source snapshot, including:

- `.github/workflows/ci.yml`
- `backend/realtime.ts` and `backend/realtime-subscribers.ts`
- `docs/` project, architecture, security, release, and reconciliation records
- `scripts/verify-contracts.mjs`
- `package-lock.json` and other repository development/build support
- Version-controlled public assets and supporting files

A wholesale copy of the staging snapshot over the repository would therefore risk deleting valid GitHub-only source, documentation, CI, and development assets. That approach was explicitly avoided.

## Outcome

- [x] Compared the staging snapshot with GitHub `main`.
- [x] Confirmed the pre-existing reconciliation branch had no unique commits and was three commits behind.
- [x] Fast-forwarded `reconcile/staging-source-2026-11-03` to current GitHub `main`.
- [x] Retained the newer GitHub implementation and excluded the staging-only mock checkout fixture.
- [x] Made no deployment or production changes.
- [ ] Merge this reconciliation record to `main` through the associated pull request after GitHub checks complete.

## Release boundary

This record confirms source-control alignment only. It does not assert that the AppDeploy staging deployment has been updated, that the live staging app matches GitHub `main`, or that browser/payment end-to-end validation has passed. Those activities remain separate and require deployment access and explicit release validation.
