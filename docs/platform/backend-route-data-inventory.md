# Backend Route & Data Inventory

**Source inspected:** `backend/index.ts` on `reconcile/appdeploy-source-2026-10-26`  
**Review date:** 26 October 2026  
**Status:** Static source inventory; not a penetration test and not proof that live routes pass end-to-end tests.

This document records the routes visible in source, their broad purpose, the authentication middleware used, and the collections/resources they appear to touch. Update it whenever routes or data ownership change.

## Middleware and access model

- `admin = [requireAuth(), requireAdminFromSecret]` is applied to routes labelled **Admin** below.
- `requireAdminFromSecret` checks the signed-in user's email against `ADMIN_EMAILS` from AppDeploy secrets, falling back to an email literal in source if the secret is missing or empty.
- Public routes have no explicit auth middleware in this file.
- This is a single-admin allowlist pattern, not a complete platform/brand role model.
- No tenant/workspace identifier or systematic tenant scoping was visible in the inspected route handlers. Do not expose this backend to multiple independent brands without designing and testing tenant isolation.

## Route catalogue

| Method | Route | Access in source | Purpose | Data/resources |
|---|---|---|---|---|
| GET | `/api/_healthcheck` | Public | Basic health response | None |
| GET | `/api/content` | Public | Returns published public content and site settings; calls seed routine | events, announcements, stories, experiences, site_settings; media URL resolution |
| GET | `/api/events/:id` | Public | Returns a non-draft, non-archived event | events; media URL resolution |
| GET | `/api/stories/:id` | Public | Returns a published story | stories; media URL resolution |
| GET | `/api/experiences/:id` | Public | Returns a published experience | experiences; media URL resolution |
| POST | `/api/messages` | Public | Validates and stores contact/partnership/community message; honeypot and basic per-email rate limit | messages |
| GET | `/api/media` | Admin | Lists media metadata and resolves storage URLs | media; object storage |
| GET | `/api/admin/status` | Admin | Returns authenticated admin role indicator | Auth context |
| GET | `/api/admin/dashboard` | Admin | Returns summary metrics and recent records | events, stories, announcements, media, messages |
| GET | `/api/admin/events` | Admin | List events | events |
| POST | `/api/admin/events` | Admin | Create event | events |
| PUT | `/api/admin/events/:id` | Admin | Update event | events |
| DELETE | `/api/admin/events/:id` | Admin | Soft archive event by setting status | events |
| GET | `/api/admin/experiences` | Admin | List experiences | experiences |
| POST | `/api/admin/experiences` | Admin | Create experience with basic required-field validation | experiences |
| PUT | `/api/admin/experiences/:id` | Admin | Update experience | experiences |
| DELETE | `/api/admin/experiences/:id` | Admin | Soft archive experience | experiences |
| GET | `/api/admin/stories` | Admin | List stories | stories |
| POST | `/api/admin/stories` | Admin | Create story with required-field validation | stories |
| PUT | `/api/admin/stories/:id` | Admin | Update story | stories |
| DELETE | `/api/admin/stories/:id` | Admin | Soft archive story | stories |
| GET | `/api/admin/announcements` | Admin | List announcements | announcements |
| POST | `/api/admin/announcements` | Admin | Create announcement with required-field validation | announcements |
| PUT | `/api/admin/announcements/:id` | Admin | Update announcement | announcements |
| DELETE | `/api/admin/announcements/:id` | Admin | Soft archive announcement | announcements |
| GET | `/api/admin/messages` | Admin | List contact messages | messages |
| PUT | `/api/admin/messages/:id` | Admin | Update message fields/status | messages |
| GET | `/api/admin/settings` | Admin | Ensure seeds then return global site settings | site_settings |
| PUT | `/api/admin/settings` | Admin | Update global site settings | site_settings |
| POST | `/api/admin/media/upload` | Admin | Validate image MIME and encoded size; write image and metadata | object storage; media |
| DELETE | `/api/admin/media/:id` | Admin | Delete object and media record | object storage; media |
| GET | `/api/admin/google-photos/config` | Admin | Returns configured Google Photos client ID and picker scope | AppDeploy secret names/secret |
| POST | `/api/admin/google-photos/session` | Admin | Creates Picker session and stores session ownership/context | Google Photos API; google_photos_picker_sessions |
| POST | `/api/admin/google-photos/session/:sessionId/status` | Admin | Reads Picker session status from Google | Google Photos API |
| POST | `/api/admin/google-photos/import/:sessionId` | Admin | Checks stored session ownership, imports selected images to storage, records media, deletes session record | google_photos_picker_sessions; Google Photos API; object storage; media |

## Collections and storage visible in source

| Collection/resource | Observed use | Notes |
|---|---|---|
| `events` | Public event listing/details; admin CRUD/archive; dashboard; seed data | Shared collection; no tenant scoping visible |
| `experiences` | Public listing/details; admin CRUD/archive; seed data | Shared collection; no tenant scoping visible |
| `stories` | Public published story listing/details; admin CRUD/archive; seed data | Shared collection; no tenant scoping visible |
| `announcements` | Active public announcement; admin CRUD/archive; dashboard | Public response filters by published status and active dates |
| `messages` | Public contact submission; admin list/update; dashboard | Contains contact information; public submission needs abuse protection and privacy handling |
| `site_settings` | Public content response; admin read/update; seed defaults | Current code treats settings as global |
| `media` | Admin list/upload/delete; dashboard; content URL resolution | Stored objects and database metadata must remain consistent |
| `google_photos_picker_sessions` | Picker session ownership/context and cleanup | Import route checks the stored session's userId; status route does not visibly perform the same stored-owner check |
| Object storage | Uploaded and imported image objects | Paths include media/uploads and media/google-photos |

## Review findings requiring follow-up

These are source-level observations to verify and address deliberately; they are not claims of exploited vulnerabilities.

1. **Tenant boundary absent:** route handlers read/write shared collections without an active brand/tenant scope. Multi-tenant rollout is blocked until server-side ownership and authorization are implemented.
2. **Admin allowlist fallback:** a literal email address is embedded in backend source as fallback. Confirm whether this is required by the deployment platform; prefer secret-backed configuration and document safe failure behavior without accidentally locking out the authorized owner.
3. **Public message abuse controls:** the contact route has a honeypot and limits recent messages by email after listing a bounded recent set. Validate its effectiveness under concurrent/high-volume requests and consider provider-level throttling or a more robust abuse control.
4. **Request validation:** several admin create/update handlers accept broad body objects. Add schema validation and explicit allowlisted fields; preserve server-owned identity/timestamp/status rules.
5. **Media integrity:** upload validates declared MIME type and encoded string length, but source inspection does not establish that the file bytes match the MIME type. Verify size limits and failure cleanup.
6. **Google Photos session authorization:** import checks the stored session user ID; the status endpoint calls Google with a caller-provided token and session ID but does not visibly cross-check the stored session owner. Review whether this can reveal session state or create unwanted calls.
7. **Seed behavior:** `ensureSeeds()` uses a process-local boolean and collection-empty checks. Validate concurrency, deployment instance behavior, and whether seed data is appropriate for production.
8. **Sensitive contact data:** message records are returned to admins; verify access control, retention, deletion, export, and logging practices.
9. **Soft deletion semantics:** events, experiences, stories, and announcements are archived by status; media is physically deleted. Document and test the intended recovery behavior.
10. **Error handling and audit trail:** review consistent error responses, operational logs, and audit events for admin mutations.

## Verification plan

- [ ] Confirm each route in this list against the current source before changing it.
- [ ] Add automated authorization tests for every admin route.
- [ ] Add public-route validation, rate-limit, and content-filter tests.
- [ ] Add cross-tenant negative tests after tenant architecture is introduced.
- [ ] Test media upload/delete failure paths and orphan cleanup.
- [ ] Test Google Photos session creation, status, import, expiry, wrong-user access, and cleanup.
- [ ] Verify seed behavior with empty, partially populated, and concurrent initialization.
- [ ] Update this inventory in the same PR as any route or collection changes.

## Explicit non-claims

- This document does not claim that every route was tested.
- It does not confirm the database schema beyond fields visible in source.
- It does not certify privacy, security, or production readiness.
- It does not establish that current production source exactly matches this branch until the source snapshot and deployed behavior are verified.
