# Current State — Urban Life Co.

**Last reviewed:** 26 October 2026  
**Purpose:** evidence-based handoff snapshot. Re-check live GitHub/AppDeploy state before release work.

## Executive status

The current AppDeploy PWA is reported **Ready** at snapshot `1793038200898`. Source reconciliation and the project handoff documentation have been merged into GitHub `main` as merge commit `3346e6aef032a971613418772e1fc1bb3dbd68fe`.

**This is not a production release.** GitHub merge did not trigger an AppDeploy deployment, and the live app remains on the previously recorded AppDeploy snapshot. The repository is not yet certified as a reproducible build of that app, and the multi-brand architecture is not ready for external tenants.

## Status ledger

| Area | Status | Evidence / caveat | Next action |
|---|---|---|---|
| Public PWA and CMS source | Present in inspected source | Source includes public pages and CMS workflows; not every journey has been independently browser-tested | Smoke-test key journeys |
| Live deployment | Ready in latest status check | AppDeploy app ID `urban-life-co-zk9nyq`; snapshot `1793038200898`; QA response reported no frontend or network errors in its snapshot, but a later Google Identity script-load warning exists in logs | Verify current user journeys and logs before release |
| GitHub reconciliation | Merged | PR #12 merged; merge commit `3346e6aef032a971613418772e1fc1bb3dbd68fe` | Keep `main` as the reviewed code baseline |
| GitHub Actions CI | Passed on merge commit | Run #37 completed successfully for commit `3346e6aef032a971613418772e1fc1bb3dbd68fe`; dependency setup, TypeScript check, Vite build, and contract checks all passed. [View run](https://github.com/emeriem/urban-life-co/actions/runs/40405648219) | Add browser-level tests and keep CI green |
| External deployment integrations | Out of scope | Urban Life Co. will use GitHub for source control/CI and AppDeploy for application development/deployment. External deployment services are not part of the approved workflow | Keep future work within GitHub and AppDeploy unless explicitly approved otherwise |
| Reproducibility against live AppDeploy source | Unverified | CI passed for the recorded GitHub merge commit, but that does not prove GitHub `main` matches the current AppDeploy snapshot or can reproduce it exactly | Complete file-by-file source drift audit and reconcile deliberately |
| Required logo asset | Blocked for GitHub-source reproducibility | AppDeploy resource inventory lists `public/resources/urban-life-logo.png`, but the path is absent from GitHub `main`. Do not fabricate a replacement | Recover the exact approved original and add it through a reviewed change if repository tracking is required |
| Admin authentication | Implemented in source; full security review pending | Email allowlist exists; it is not a complete roles/tenant permissions model | Review authentication and authorization route-by-route |
| Google sign-in / Photos | Needs verification | AppDeploy logs show a Google Identity script-load warning; this alone does not establish a current user-facing defect | Browser-test sign-in, picker, import, and failure handling |
| QA scenarios | Present; execution evidence incomplete | `tests/tests.json` contains scenario definitions; contract checker validates their shape but is not a browser test runner | Identify and run a real browser-test suite |
| Multi-tenant isolation | Not implemented/proven | Inspected backend does not show a clear tenant/workspace boundary across shared collections | Design and test before external onboarding |
| Production deployment from GitHub | Not established | AppDeploy remains the deployment/release record; no release was triggered during reconciliation | Define a controlled release and rollback procedure after validation |

## Current engineering checks

The repository has a GitHub Actions workflow at [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). It is configured to run:
1. TypeScript checks.
2. A Vite production build.
3. Static backend/API route and regression-test contract checks.

These checks are useful but have limits: the workflow creates a temporary CI-only shim for the AppDeploy runtime client, and the contract script checks test definitions and source patterns rather than executing browser journeys. A green result is evidence for those checks only—not proof that the deployed app works end-to-end or that GitHub source matches the current AppDeploy snapshot.

The GitHub Actions workflow passed on merge commit `3346e6aef032a971613418772e1fc1bb3dbd68fe` (run #37). Its successful steps include dependency setup with the CI-only AppDeploy client shim, TypeScript checking, the Vite production build, and static contract checks. This does not establish end-to-end browser behavior. A third-party status check may still appear on GitHub commits, but it is not part of the approved release workflow and must not drive work or deployment decisions.

## Backend documentation

- [Backend route and data inventory](backend-route-data-inventory.md) — static source inspection, not runtime or penetration-test evidence.
- [Architecture and gap audit](architecture-gap-audit.md) — current platform risks and target architecture.
- [Platform vision and roadmap](vision-and-roadmap.md) — product direction and staged delivery.

## Prioritized work queue

### P0 — Prove the code baseline
- [x] Verify the GitHub Actions result for merge commit `3346e6aef032a971613418772e1fc1bb3dbd68fe`; run #37 passed. [Run details](https://github.com/emeriem/urban-life-co/actions/runs/40405648219).
- [ ] Complete file-by-file comparison between the current AppDeploy snapshot and GitHub `main`; record all material differences.
- [ ] Recover the exact approved logo asset and verify all referenced static resources.
- [ ] Re-run/verify dependency setup, TypeScript checks, production build, and contract checks against the current branch head; document exact commit and results.
- [ ] Run browser smoke tests for public routes, admin login, CMS CRUD, media, Google Photos, and PWA behavior.
- [ ] Review backend authentication, authorization, validation, and data operations for unintended exposure or destructive behavior.
- [ ] Document environment variables/secrets by name and purpose only—never values.

### P1 — Establish a maintainable engineering baseline
- [x] Reconcile key AppDeploy source files into GitHub and merge the handoff documentation.
- [x] Add an initial route-and-data inventory from source inspection.
- [x] Configure a GitHub Actions type/build/contract-check workflow.
- [x] Verify type/build/contract CI on the recorded merge commit.
- [ ] Add real browser regression tests.
- [ ] Document backup, rollback, deployment verification, and incident response within the GitHub + AppDeploy workflow.
- [ ] Define and test the relationship between AppDeploy snapshots and GitHub commits.

### P2 — Prepare multi-brand architecture
- [ ] Define tenant/brand data model and migration plan.
- [ ] Define platform owner, brand owner, editor, support, and member roles.
- [ ] Enforce server-side tenant scoping for database records, media, APIs, and exports.
- [ ] Add cross-tenant negative tests for every relevant operation.
- [ ] Establish audit logs, invitation/revocation, backup/restore, and tenant lifecycle processes.

### P3 — Pilot and commercialise
- [ ] Keep Urban Hikers as the first tenant/pilot.
- [ ] Validate onboarding and core workflows with real users.
- [ ] Decide integrations, payment provider(s), plan limits, pricing, support, and launch criteria from evidence.
- [ ] Invite external brands only after security isolation and operational readiness are verified.

## Release gate

No production release from GitHub until:
1. The exact required assets and runtime dependencies are accounted for.
2. Build/type checks pass or justified exceptions are documented and approved.
3. Critical browser smoke tests pass.
4. Authentication and backend routes have been reviewed.
5. A known-good rollback point and release verification checklist exist.
6. The release path uses only GitHub for source control/CI and AppDeploy for application deployment; unrelated status integrations are not release gates.
7. The owner explicitly approves deployment.
