# Urban Life Co.

Urban Life Co. is the parent lifestyle ecosystem for experiences that help people **Live. Connect. Explore.**

## Project

This repository contains the current Urban Life Co. web/PWA workspace deployed through AppDeploy.

### Public experience
- Urban Life Co. parent brand
- Urban Hikers
- Urban Fitness
- Urban Connect
- Events
- Journal
- Community
- Contact

### Private CMS
The application includes a Super Admin CMS for events, experiences, journal stories, announcements, messages, media, site content, and Google Photos media import.

## Development

```bash
npm install
npm run dev
npm run build
```

## Deployment — Required project standard

**AppDeploy is the official deployment platform and the shared deployment record for this project. All production deployments and updates must go through the official AppDeploy dashboard/tooling. Do not publish this application to an alternate host or create a second AppDeploy app unless the project owner explicitly requests it.**

- **AppDeploy dashboard:** https://dashboard.appdeploy.ai
- **Existing app name:** Urban Life Co.
- **Canonical AppDeploy app ID:** `urban-life-co-zk9nyq`
- **Live URL:** https://urban-life-co-zk9nyq.v2.appdeploy.ai/
- **Update rule:** update the existing app using the canonical app ID; do not create a new app for routine changes.
- **Release rule:** follow the AppDeploy deployment workflow, wait for a terminal status, and inspect validation, QA, and runtime errors before reporting a release as complete.
- **Shared-agent rule:** every AI agent/LLM working on this repository should use the same AppDeploy app ID and dashboard as the source of truth for deployment status, snapshots, and the live release. Check that the AppDeploy connector is authorized for the same account/workspace if the app is not visible. Access cannot be guaranteed merely by this README if an agent's account lacks permissions.
- **Source control:** GitHub stores the repository code and project documentation; AppDeploy remains the official production deployment record. Keep these in sync intentionally and never assume a GitHub commit alone has deployed the site.

Keep secrets and credentials out of source control.

## Repository structure

- `src/` — React application
- `backend/` — AppDeploy API and realtime handlers
- `public/` — PWA assets and service worker
- `tests/` — product QA scenarios
- `docs/` — project documentation

## Security

The Super Admin allowlist is enforced server-side. The encrypted `ADMIN_EMAILS` AppDeploy secret (comma-separated) takes precedence; the current AppDeploy deployment validator also requires a literal fallback in backend source, which is a temporary security trade-off documented in `docs/security/review-2026-10.md`. Google Photos access tokens must never be committed to this repository.
