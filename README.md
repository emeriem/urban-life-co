# Urban Life Co.

**Live. Connect. Explore.**

Urban Life Co. is the parent lifestyle ecosystem for experiences, communities, products, and businesses that help people Live. Connect. Explore.

> **New contributor? Start with [the project handoff guide](docs/START-HERE.md).** It explains what exists, what is planned, known risks, how to work safely, and where to continue.

## At a glance

- **Product today:** an existing React/Vite progressive web app (PWA) with public-facing brand, events, experiences, journal, community, and contact experiences, plus a private Super Admin CMS.
- **Long-term direction:** evolve the current product into a modular, multi-brand platform for Urban Life Co. and eventually other lifestyle brands and communities.
- **Current focus:** safely reconcile source code, verify the existing workflows, document the system, then establish secure foundations before implementing multi-brand tenancy.
- **Important:** multi-tenant isolation is **not yet established**. Do not onboard external brands or treat this as production-ready SaaS for multiple tenants.

## Canonical links and systems

| Purpose | Location |
|---|---|
| GitHub repository | https://github.com/emeriem/urban-life-co |
| Current reconciliation PR | https://github.com/emeriem/urban-life-co/pull/12 |
| Handoff guide | [docs/START-HERE.md](docs/START-HERE.md) |
| Current status and next actions | [docs/platform/current-state.md](docs/platform/current-state.md) |
| Platform vision and roadmap | [docs/platform/vision-and-roadmap.md](docs/platform/vision-and-roadmap.md) |
| Architecture and gap audit | [docs/platform/architecture-gap-audit.md](docs/platform/architecture-gap-audit.md) |\n| Backend route/data inventory | [docs/platform/backend-route-data-inventory.md](docs/platform/backend-route-data-inventory.md) |
| Source reconciliation log | [docs/platform/source-reconciliation.md](docs/platform/source-reconciliation.md) |
| Contribution and safety workflow | [CONTRIBUTING.md](CONTRIBUTING.md) |
| AppDeploy dashboard | https://dashboard.appdeploy.ai |
| Live application | https://urban-life-co-zk9nyq.v2.appdeploy.ai/ |

## Source control and deployment

- **Canonical AppDeploy app ID:** `urban-life-co-zk9nyq`.
- **AppDeploy is the production deployment/release record.** GitHub is the version-controlled source and documentation home.
- A GitHub commit, PR merge, or successful CI check does **not** mean the live app has been deployed.
- Do not create a second AppDeploy app or publish to another host for routine work.
- Do not deploy from the reconciliation branch until the outstanding asset, build, runtime, security, and review checks are resolved.
- Keep secrets, access tokens, OAuth credentials, customer data, and production exports out of Git.

## Current working branch

The source-reconciliation work is on `reconcile/appdeploy-source-2026-10-26`, associated with draft [PR #12](https://github.com/emeriem/urban-life-co/pull/12). The branch is a review candidate, not a release candidate. Check the live PR and CI status rather than relying on a number of commits recorded in older notes.

## Local development

Requirements: a supported Node.js/npm installation and repository access.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run check:types
npm run build
npm run preview
```

The commands are documented from `package.json`; **they have not yet been certified as passing for the reconciled branch**. The repository's package configuration retains the AppDeploy client and local type-check tooling intentionally. If install/build fails, record the exact command, runtime versions, and full error before changing dependencies.

## Repository map

- `src/` — React application and UI.
- `backend/index.ts` — AppDeploy API routes, authentication checks, and data operations.
- `public/` — PWA manifest, service worker, icons, and static assets.
- `tests/tests.json` — QA scenario definitions; definitions are not proof that tests passed.
- `docs/START-HERE.md` — contributor orientation and continuation path.
- `docs/platform/` — product direction, current state, architecture risks, and source history.
- `CONTRIBUTING.md` — safe change/review/deployment rules.

## Current known blockers

1. The AppDeploy snapshot references `public/resources/urban-life-logo.png`, but that exact file was not found in the GitHub reconciliation branch. Recover the approved original; do not fabricate a replacement.
2. Build and TypeScript checks have not been verified as passing for the reconciled branch.
3. Full source diffs and runtime workflows still need review and smoke testing.
4. Admin access currently relies on an email allowlist, not a complete multi-role/tenant permission model.
5. Tenant isolation is not implemented/proven. External brand onboarding is blocked until the architecture, enforcement, and cross-tenant tests exist.
6. A Google Identity script load warning was observed in AppDeploy logs; verify actual sign-in and Google Photos flows in a real browser before diagnosing it as a confirmed defect.

See [current state](docs/platform/current-state.md) for the sequenced work list and evidence status.

## Security baseline

- Never commit secrets, OAuth tokens, service credentials, private customer/member information, or production database exports.
- Use AppDeploy secret management for runtime secrets.
- Review authorization in backend handlers, not only in the UI.
- Treat all input and every tenant boundary as untrusted until enforced and tested server-side.
- Do not loosen authentication, replace real assets with placeholders, or deploy to bypass a failing check.
- For security-sensitive changes, document the threat, the change, the test evidence, and rollback plan.

## Product principle

Evolve the current app rather than rewriting it by default. Build the smallest safe next step, preserve working Urban Hikers functionality, and distinguish **implemented**, **verified**, **planned**, and **unknown** in every status update.
