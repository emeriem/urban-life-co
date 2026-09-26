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

## Deployment

The production deployment is managed through AppDeploy. Keep secrets and credentials out of source control.

## Repository structure

- `src/` — React application
- `backend/` — AppDeploy API and realtime handlers
- `public/` — PWA assets and service worker
- `tests/` — product QA scenarios
- `docs/` — project documentation

## Security

The Super Admin allowlist is enforced server-side. Google Photos access tokens are intended to remain session-scoped and must never be committed to this repository.
