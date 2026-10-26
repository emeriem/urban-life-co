# Source Reconciliation Log
**Version 0.2 · 26 October 2026**

## Goal
Bring the GitHub repository into alignment with the current working AppDeploy source without overwriting the production deployment or losing existing capabilities.

## Source-of-truth rules during reconciliation
- AppDeploy snapshot 1793038200898 is the source reference for the currently deployed application code.
- AppDeploy is the official deployment and release record.
- GitHub remains the version-controlled source repository and documentation home.
- Reconciliation work happens on a dedicated branch, not directly on `main`.
- No production deployment is part of the source-copy or merge step.
- Keep local development dependencies and scripts needed for reproducible builds even where AppDeploy's generated `package.json` differs.
- Do not copy secrets or OAuth tokens into GitHub.
- Keep required static resources; verify the logo asset separately rather than replacing it with a placeholder.

## Known drift at start
| Path | AppDeploy snapshot | GitHub main | Handling |
|---|---:|---:|---|
| `src/App.tsx` | 2,401 lines | 841 lines | Copy snapshot to reconciliation branch; review diff and build |
| `backend/index.ts` | 836 lines | 114 lines | Copy snapshot to reconciliation branch; inspect routes and auth |
| `src/index.css` | 3,614 lines | 3,088 lines | Copy snapshot to reconciliation branch; review visual changes |
| `index.html` | 43 lines | 32 lines | Copy snapshot to reconciliation branch; review metadata and script tags |
| `package.json` | 30 lines | 30 lines | Merge intentionally; preserve `@appdeploy/client` and `check:types` local tooling |
| Other source/config files | Not yet compared in detail | Existing files | Compare path-by-path before deciding |

## Reconciliation work completed
- [x] Current AppDeploy snapshot identified.
- [x] GitHub drift confirmed for key application files.
- [x] Dedicated reconciliation branch created.
- [x] Main source inventory and AppDeploy snapshot paths compared.
- [x] Synced AppDeploy versions of `backend/index.ts`, `index.html`, `postcss.config.js`, `public/icon.svg`, `public/manifest.webmanifest`, `public/sw.js`, `src/App.tsx`, `src/index.css`, `src/main.tsx`, `tailwind.config.js`, `tsconfig.json`, and `vite.config.ts` to the reconciliation branch where content differed.
- [x] Added platform vision, preliminary architecture/gap audit, and reconciliation log under `docs/platform/`.
- [x] Added contributor handoff guide, current-state ledger, expanded README, contribution/release workflow, and backend route/data inventory.
- [x] Preserved GitHub `package.json` because it contains local development tooling (`@appdeploy/client` and `check:types`) not present in the AppDeploy snapshot package file.
- [x] Preserved the existing GitHub `tests/tests.json` suite pending deliberate review rather than silently replacing it with the smaller snapshot test file.
- [x] PR #12 merged into `main` as merge commit `3346e6aef032a971613418772e1fc1bb3dbd68fe`.
- [x] Verified GitHub Actions run #37 for the merge commit: dependency setup, TypeScript check, Vite production build, and static contract checks all passed. [Run details](https://github.com/emeriem/urban-life-co/actions/runs/40405648219).
- [ ] Resolve the failed Vercel status check.
- [ ] Recover or add the required logo resource at `public/resources/urban-life-logo.png`.
- [ ] Verify runtime behavior and define a controlled deployment/rollback workflow.

## Post-merge verification — 26 October 2026
- PR #12 is merged and closed. The merge commit is `3346e6aef032a971613418772e1fc1bb3dbd68fe`.
- AppDeploy reports the existing app as Ready at snapshot `1793038200898`. This does not mean GitHub `main` has been deployed; no deployment was triggered by the merge.
- The combined status endpoint reports a failed Vercel check for the merge commit. The underlying Vercel target could not be inspected with the available access, so the cause remains unknown.
- The repository has `.github/workflows/ci.yml`, configured to run type checks, a Vite build, and static API/contract checks on pushes and pull requests. GitHub Actions run #37 completed successfully on merge commit `3346e6aef032a971613418772e1fc1bb3dbd68fe`; dependency setup, TypeScript checking, Vite production build, and static contract checks all passed. [View run](https://github.com/emeriem/urban-life-co/actions/runs/40405648219). This is not browser/end-to-end test evidence.
- The required resource `public/resources/urban-life-logo.png` is present in AppDeploy's resource inventory but absent from GitHub `main`. The original binary could not be retrieved through the available GitHub file access. Do not substitute a generated or placeholder logo.
- AppDeploy logs include a Google Identity script-load warning. Verify user-facing Google sign-in and Photos workflows before treating this as a defect or dismissing it as harmless.

## Known exceptions and blockers
- The required AppDeploy logo resource is listed in the AppDeploy resource inventory but is not present at that path in GitHub `main`. Recover the exact asset or explicitly add the approved original before attempting a deployment from GitHub.
- `package.json` is intentionally retained from GitHub for local development and type-check tooling. Its difference from AppDeploy's generated package file must be validated in a reproducible build rather than blindly overwritten.
- The GitHub test suite is intentionally preserved. Its difference from the AppDeploy snapshot's `tests/tests.json` remains to be reviewed.
- Static contract checks are not browser tests and do not prove end-to-end runtime behavior.
- No production deployment was triggered during reconciliation or merge.

## Safety note
A source merge is not proof that the merged source is safe to deploy. Build configuration, environment assumptions, secret bindings, resource assets, authorization boundaries, and runtime behavior must be checked first.
