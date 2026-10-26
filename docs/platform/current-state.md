# Current State — Urban Life Co.

**Last reviewed:** 26 October 2026  
**Purpose:** an evidence-based handoff snapshot. Re-check live GitHub/AppDeploy state before acting.

## Executive status

The project has an existing deployed PWA and an in-progress GitHub source-reconciliation branch. The long-term platform direction is documented. The repository is **not yet certified as a reproducible build of the live app**, and the multi-brand architecture is **not ready for external tenants**.

## Status ledger

| Area | Status | Evidence / caveat | Next action |
|---|---|---|---|
| Public PWA and CMS source | Implemented in inspected source | Source contains public pages and CMS workflows; not all flows were independently browser-tested | Smoke-test key journeys |
| Live deployment | Exists | AppDeploy app ID `urban-life-co-zk9nyq`; snapshot `1793038200898` was reported Ready when inspected | Re-check current status before release work |
| GitHub reconciliation | In progress | Branch `reconcile/appdeploy-source-2026-10-26`; draft PR #12 | Review complete diff and resolve blockers |
| Local reproducible build | Unknown / unverified | `npm run build` and `npm run check:types` have not been confirmed passing for this branch | Run checks and preserve logs |
| Required logo asset | Blocked | `public/resources/urban-life-logo.png` is required in AppDeploy resource inventory but absent at that path in the branch | Recover exact approved asset |
| Admin authentication | Implemented in source; full security review pending | Email allowlist exists; not a complete roles/tenant permissions model | Map auth and authorization route-by-route |
| Google sign-in / Photos | Needs verification | AppDeploy log showed a Google Identity script load warning; warning alone does not establish current failure | Browser-test sign-in, picker, import, and error handling |
| QA scenarios | Present, execution unverified | `tests/tests.json` contains scenario definitions | Identify runner/format and record real test results |
| Multi-tenant isolation | Not implemented/proven | Inspected backend did not show a clear tenant/workspace boundary across shared collections | Design and test before external onboarding |
| Production deployment from GitHub | Not established | AppDeploy remains the deployment record; no release was triggered during reconciliation | Create controlled release/rollback procedure after validation |

## Known source decisions

- The reconciliation branch copies the current AppDeploy snapshot's key source files where they differed from GitHub main.
- GitHub's `package.json` was retained to preserve local development tooling, including `@appdeploy/client` and `check:types`; validate it with a reproducible build.
- The existing broader GitHub `tests/tests.json` suite was retained rather than silently replacing it with the smaller AppDeploy snapshot test file.
- The exact missing logo asset was not fabricated.
- Production was not deployed or changed as part of the source-copy work.

See [source reconciliation log](source-reconciliation.md) for file-level history.

## Prioritized work queue

### P0 — Make the repo trustworthy
- [ ] Recover the exact approved logo asset and verify all referenced static resources.
- [ ] Review all changed files in PR #12 against the AppDeploy snapshot and GitHub baseline.
- [ ] Run dependency installation, TypeScript checks, and production build; document exact versions/results.
- [ ] Fix reproducibility blockers without blindly replacing package configuration.
- [ ] Run browser smoke tests for public routes, admin login, CMS CRUD, media, Google Photos, and PWA behavior.
- [ ] Review backend auth and data operations for unintended exposure and destructive behavior.
- [ ] Ensure PR checks are complete and review PR #12 before merge.

### P1 — Establish a maintainable engineering baseline
- [ ] Add a route-and-data inventory: route, method, authentication, authorization, input validation, collections, side effects, and failure handling.
- [ ] Document environment variables/secrets by name and purpose only—never values.
- [ ] Add automated checks for type/build and the most critical regression flows.
- [ ] Document backup, rollback, deployment verification, and incident response.
- [ ] Define a clear relationship between AppDeploy snapshots and GitHub commits.

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

No production release from this branch until:
1. The exact required assets and runtime dependencies are accounted for.
2. Build/type checks pass or any justified exceptions are documented and approved.
3. Critical browser smoke tests pass.
4. Authentication and backend routes have been reviewed.
5. A known-good rollback point and release verification checklist exist.
6. The owner explicitly approves deployment.
