# Source Reconciliation Log
**Version 0.1 · 26 October 2026**

## Goal
Bring the GitHub repository into alignment with the current working AppDeploy source without overwriting the production deployment or losing existing capabilities.

## Source-of-truth rules during reconciliation
- AppDeploy snapshot 1793038200898 is the source reference for the currently deployed application code.
- AppDeploy is the official deployment and release record.
- GitHub remains the version-controlled source repository and documentation home.
- Reconciliation work happens on branch reconcile/appdeploy-source-2026-10-26, not directly on main.
- No production deployment is part of the source-copy step.
- Keep local development dependencies and scripts needed for reproducible builds even where AppDeploy's generated package.json differs.
- Do not copy secrets or OAuth tokens into GitHub.
- Keep required static resources; verify the logo asset separately rather than replacing it with a placeholder.

## Known drift at start
| Path | AppDeploy snapshot | GitHub main | Handling |
|---|---:|---:|---|
| src/App.tsx | 2,401 lines | 841 lines | Copy snapshot to reconciliation branch; review diff and build |
| backend/index.ts | 836 lines | 114 lines | Copy snapshot to reconciliation branch; inspect routes and auth |
| src/index.css | 3,614 lines | 3,088 lines | Copy snapshot to reconciliation branch; review visual changes |
| index.html | 43 lines | 32 lines | Copy snapshot to reconciliation branch; review metadata and script tags |
| package.json | 30 lines | 30 lines | Merge intentionally; preserve @appdeploy/client and check:types local tooling |
| Other source/config files | Not yet compared in detail | Existing files | Compare path-by-path before deciding |

## Safe sequence
1. Preserve the current production snapshot and record its ID.
2. Create a dedicated reconciliation branch from GitHub main.
3. Copy the latest AppDeploy text source files to that branch, preserving required local development tooling and existing assets.
4. Add the platform roadmap, preliminary audit, source log, current-state ledger, and contributor handoff under docs/.
5. Review diffs and run build/type checks where tooling permits.
6. Create a pull request for review; do not merge automatically.
7. After reconciliation is reviewed and merged, define the controlled deployment workflow and verify the exact commit before any production release.

## Current status
- [x] Current AppDeploy snapshot identified.
- [x] GitHub drift confirmed for key application files.
- [x] Reconciliation branch created.
- [x] Main source inventory and AppDeploy snapshot paths compared.
- [x] Synced AppDeploy versions of backend/index.ts, index.html, postcss.config.js, public/icon.svg, public/manifest.webmanifest, public/sw.js, src/App.tsx, src/index.css, src/main.tsx, tailwind.config.js, tsconfig.json, and vite.config.ts to the reconciliation branch where content differed.
- [x] Added platform vision, preliminary architecture/gap audit, and reconciliation log under docs/platform/.
- [x] Added a top-level contributor handoff guide, current-state ledger, expanded README, and contribution/release workflow.
- [x] Preserved GitHub package.json because it contains local development tooling (@appdeploy/client and check:types) not present in the AppDeploy snapshot package file.
- [x] Preserved the existing GitHub tests/tests.json suite pending deliberate review because replacing it with the snapshot version would remove many existing QA scenarios.
- [ ] Recover or add the required logo resource at public/resources/urban-life-logo.png; it is configured as a required AppDeploy resource but was not found in GitHub main.
- [ ] Review full diffs and verify AppDeploy resource and build assumptions.
- [ ] Build/type checks completed.
- [x] Draft pull request opened: https://github.com/emeriem/urban-life-co/pull/12.
- [ ] Draft pull request reviewed.
- [ ] GitHub main reconciled.
- [ ] Controlled deployment from reconciled source verified.

## Pull request and validation status
- Draft PR: https://github.com/emeriem/urban-life-co/pull/12
- A fresh GitHub comparison on 26 October 2026 reported the branch 23 commits ahead of main and 0 behind. This count changes as commits are added; check the live comparison rather than treating it as a durable status.
- Review submissions and inline review threads were empty at the latest check. CI/build/type-check success remains unverified; inspect live checks before merging.
- Production remains unchanged; no AppDeploy deployment was triggered.

## Known exceptions and blockers
- The required AppDeploy logo resource at public/resources/urban-life-logo.png is listed in AppDeploy resource inventory but was not present at that path in the GitHub branch. Do not replace it with a placeholder. Recover the exact asset or explicitly add the approved original before attempting a deployment from GitHub.
- package.json is intentionally retained from GitHub for local development and type-check tooling. Its difference from AppDeploy's generated package file must be validated in a local/reproducible build rather than blindly overwritten.
- The GitHub test suite is intentionally preserved on this branch. Its difference from the AppDeploy snapshot's tests/tests.json remains to be reviewed.

## Safety note
The reconciliation branch is not automatically safe to deploy merely because it contains a newer AppDeploy snapshot. Build configuration, environment assumptions, secret bindings, asset resources, and runtime behaviour must be checked first.
