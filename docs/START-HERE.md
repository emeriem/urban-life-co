# Start Here — Urban Life Co.

This guide is the fastest route for a new developer, collaborator, or AI coding agent to understand the repository and continue work without relying on chat history.

## 1. The mission

Urban Life Co. is the parent company behind lifestyle, community, outdoor, travel, education, and innovation brands. Its promise is **Live. Connect. Explore.**

The current application is the starting product, not a disposable prototype. The long-term ambition is a modular platform that lets Urban Life Co. operate its own brands and, after the foundations are proven, offer independent digital workspaces to other lifestyle brands and communities.

## 2. Read in this order

1. [Repository README](../README.md) — overview, links, local commands, blockers.
2. [Current state](platform/current-state.md) — what is known, unknown, blocked, and next.
3. [Source reconciliation log](platform/source-reconciliation.md) — the history of the completed source alignment and what was intentionally preserved.
4. [Architecture and gap audit](platform/architecture-gap-audit.md) — risks and technical priorities.
5. [Backend route and data inventory](platform/backend-route-data-inventory.md) — endpoints, access model, collections, and source-level follow-ups.
6. [Vision and roadmap](platform/vision-and-roadmap.md) — product direction and phased plan.
7. [Contribution guide](../CONTRIBUTING.md) — safe development and release rules.

## 3. What exists today

Based on source inspection, the app currently includes:
- A React/Vite public-facing PWA for Urban Life Co. and its lifestyle/community experiences.
- Public sections for brand information, experiences, events, journal content, community, and contact.
- A private Super Admin CMS for managing events, experiences, stories, announcements, messages, media, and site settings.
- Media upload/list/delete workflows and a Google Photos Picker/import integration.
- A web app manifest and service worker.

These are **source-observed capabilities**. Do not infer that every path is currently working in production. Verify workflows and record evidence before changing their status to “working”.

## 4. What we are building toward

The target is a multi-brand operating platform with:
- A platform-owner control plane for onboarding, plans, feature access, support, and governance.
- Separate brand workspaces, visual identity, content, settings, team roles, and member data.
- Reusable modules for publishing/media, events/registration, community/CRM, communications, commerce, analytics, and automation.
- Safe integrations where buying/connecting a specialist service is better than rebuilding it.

This is the **target state**, not a description of what is already implemented.

## 5. Current architectural truth and non-negotiable blocker

The inspected backend looks like a single-brand app with an admin email allowlist and shared collections. No clear tenant/workspace identifier and complete tenant-scoped authorization system was found in the inspected source.

**Do not onboard outside brands or claim SaaS-grade tenant isolation until the tenant model is implemented and tested server-side.** A brand selector in the UI is not security. Every tenant-owned record, read, write, upload, delete, and background operation must be scoped and authorized. Add cross-tenant negative tests.

The current admin allowlist is also not a complete role system for platform owners, brand owners, editors, and support staff.

## 6. Source and release rules

- Repository: https://github.com/emeriem/urban-life-co
- Source reconciliation: [PR #12](https://github.com/emeriem/urban-life-co/pull/12), merged into `main`
- Canonical AppDeploy app ID: `urban-life-co-zk9nyq`
- Live app: https://urban-life-co-zk9nyq.v2.appdeploy.ai/

`main` is the reviewed GitHub source baseline. AppDeploy is the official deployment/release record; GitHub is source control and documentation. A merge does not deploy the app. Before any release, verify required resources, build, auth, runtime flows, environment assumptions, and rollback. Do not create a replacement app or alternate production host.

## 7. Immediate continuation plan

Use the current repository state and open PRs rather than the historical reconciliation branch:

1. **Check the current state and CI** for the exact branch/commit under review. The type/build workflow uses a disposable shim for the AppDeploy runtime client; do not commit a substitute client.
2. **Recover the approved logo asset** at `public/resources/urban-life-logo.png` or formally confirm the correct asset/path with the owner before using that path.
3. **Run the CI checks**: `npm run check:types`, `npm run build`, and `node scripts/verify-contracts.mjs`. CI installs dependencies and creates the required runtime-client shim; use the workflow for reproducible results. Record Node/npm versions and outcomes.
4. **Smoke-test current behavior** in a browser: public pages, admin sign-in, CMS create/update/delete, media upload, Google Photos picker/import, mobile/PWA install and offline behavior.
5. **Map backend routes and collections** with auth requirements, read/write behavior, validation, and data ownership. Add a route/data inventory to docs.
6. **Fix confirmed regressions** with focused changes and regression tests. Re-run checks.
7. **Review and merge changes** only after their blockers are resolved. Keep production unchanged until a controlled release is explicitly approved.
8. **Design tenant security before multi-brand UI**: tenant identity, membership, role model, server-side data scoping, media isolation, audit logs, migration/backfill, and cross-tenant negative tests.
9. **Pilot with Urban Hikers first**, then invite external brands only after isolation and operational readiness are demonstrated.

## 8. Status language

Every status update must distinguish:
- **Implemented:** code exists.
- **Verified:** an observed test or production workflow passed, with evidence/date.
- **Planned:** approved future work not yet implemented.
- **Unknown:** evidence is missing or contradictory.
- **Blocked:** a dependency or risk prevents safe progress.

Never label a feature “working” merely because source code or a test scenario exists.

## 9. If you are an AI agent

Before editing:
1. Read this guide and the current-state note.
2. Inspect the actual branch, latest commit, open PR, and CI results; these may have changed since this document was written.
3. Inspect relevant source and tests; do not rely solely on summaries.
4. Make a small, reversible change on a feature branch.
5. Update the status/decision docs and tests when behavior or assumptions change.
6. Report files changed, commands run, observed outcomes, unresolved risks, and whether anything was deployed.

Do not expose secrets or personal information in logs, issues, or documentation.
