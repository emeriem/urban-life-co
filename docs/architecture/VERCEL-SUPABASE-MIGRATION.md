# Hosting Migration Plan: Vercel + Supabase

## Goal
Move the Urban Life Co. application off AppDeploy without losing the public website, Super Admin CMS, event/content management, media library, or Google Photos import workflow.

## Safety rules
- Work only on `migration/vercel-supabase` until build, runtime, security, and functional checks pass.
- Do not change `main` or the current production deployment during migration.
- Never commit service-role keys, OAuth client secrets, access tokens, or other credentials.
- Never put Supabase service-role credentials in browser code.
- Do not remove AppDeploy dependencies from the production branch until replacements are implemented and tested.

## Current repository findings
- Frontend: React 19 + Vite, with `src/App.tsx` importing `api` and `auth` from `@appdeploy/client`.
- Build blocker: `@appdeploy/client` is declared as a dependency but cannot be installed from the public npm registry.
- Backend: `backend/index.ts` imports `router`, `json`, `error`, `requireAuth`, `RouterMiddleware`, `db`, `secrets`, and `storage` from `@appdeploy/sdk`.
- Backend capabilities include public content reads, contact messages, Super Admin authorization, CRUD for events/experiences/stories/announcements/settings, media upload/delete, and Google Photos picker sessions/import.
- The current backend's admin allowlist fallback is source code. During migration, authorization must be enforced server-side and credentials must be stored in platform environment secrets.
- Existing README says AppDeploy is the production host; this migration branch supersedes that policy only after migration is explicitly approved and verified.

## Target architecture
- Vercel: React/Vite frontend and serverless API routes.
- Supabase: Postgres database, Auth, and Storage.
- Vercel server-side functions or Supabase Edge Functions: privileged API operations and Google Photos token/session handling.
- GitHub: source of truth; production changes only after review and checks.

## Migration phases
1. **Inventory and baseline**
   - Map every frontend API/auth call to its backend route.
   - Record data fields, authorization requirements, upload flows, and Google Photos endpoints.
   - Capture the current production behavior and existing test scenarios.
2. **Provision infrastructure**
   - Create a Supabase project and tables/storage buckets.
   - Configure Auth providers and admin authorization.
   - Configure Vercel project/environment variables.
   - Keep all secrets outside Git.
3. **Replace frontend client**
   - Remove `@appdeploy/client` only when equivalent API and auth adapters exist.
   - Keep UI behavior stable while changing the integration layer.
4. **Replace backend SDK**
   - Reimplement API endpoints with server-side handlers and Supabase.
   - Enforce admin authorization for every CMS/media/Google Photos route.
   - Validate and limit uploads; preserve public-vs-draft visibility rules.
5. **Deploy preview**
   - Build and test the Vercel preview.
   - Verify public pages, direct links, contact submission, admin login/denial, CRUD, uploads, and mobile layout.
   - Verify Google Photos separately after OAuth configuration.
6. **Cutover**
   - Review results, back up any live content that is not already represented in Git, then explicitly approve production cutover.
   - Keep rollback instructions and the old deployment available until the new site is verified.

## Acceptance criteria
- `npm ci` and `npm run build` pass on Vercel without any AppDeploy npm dependency.
- Public content loads from Supabase-backed API routes.
- Unauthenticated users cannot access admin APIs.
- Non-admin authenticated users receive a denial response.
- Admin CRUD, messages, settings, and media operations work end-to-end.
- No secrets or access tokens are committed or sent to the browser unnecessarily.
- Existing public URL routes and responsive behavior remain intact.
- Google Photos import works after OAuth is configured, or is clearly disabled with a useful admin-facing setup message until configuration is complete.
