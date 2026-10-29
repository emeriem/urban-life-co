# App Feature Audit — Urban Life Co.

**Audit date:** 2026-10-29  
**App:** `urban-life-co-zk9nyq`  
**Live URL:** https://urban-life-co-zk9nyq.v2.appdeploy.ai/  
**Scope:** Static source review, backend/API contract review, current AppDeploy QA snapshot, and CI checks. This is not a claim that every user journey has passed a real browser test.

## Feature status

| Area | Evidence / current status | Remaining verification |
|---|---|---|
| Public homepage and content discovery | Frontend and public content/detail API routes exist. AppDeploy QA snapshot reports no frontend or network errors. | Manually exercise navigation and real content detail routes on desktop and mobile. |
| Events CMS | Create, edit and archive routes exist. Writes use an event allowlist and event-specific status values; capacity is constrained to a whole number. | Browser test create → publish → edit → archive, including malformed payload rejection. |
| Experiences CMS | Create, edit and archive routes exist. Writes use an experience allowlist and draft/published/archived statuses. | Browser test persistence and public visibility. |
| Journal CMS | Create, edit and archive routes exist. Writes use a story allowlist and content statuses. | Browser test long-form content, cover images, and published-only visibility. |
| Announcements | Create, edit and archive routes exist. Priority, status, start and expiry fields are validated. | Browser test schedule boundaries, expiry, and public banner behaviour. |
| Messages/contact | Public submission validates required fields/email and applies a basic per-email rate limit; admin updates are status-only. | Browser test submit → inbox → status update and rate-limit behaviour. |
| Site settings | Updates accept only the homepage fields used by the settings form. | Browser test saved settings survive refresh and render publicly. |
| Direct media upload | Server checks base64 form, declared MIME type, and image signature bytes before storing. | Exercise valid JPEG/PNG/GIF/WebP and rejected SVG/HTML/mismatched MIME fixtures against the running API. |
| Google Photos | OAuth configuration route, picker session creation, polling and import exist. Poll/import require the creating admin's session ownership; imports inspect actual image signatures and expired sessions are rejected. | Complete OAuth/picker/import using the configured Google project; test cross-user session denial and retry/expiry in a browser. |
| Admin access | Source uses only the AppDeploy `ADMIN_EMAILS` secret and fails closed when absent/empty. The secret name exists in AppDeploy; its value was not read. | Confirm privately that the secret contains the intended administrator email, then test allowed and denied accounts. |
| PWA/install/offline | Manifest, service worker and UI connection/install/update handling exist. | Real-device install, offline cache, update and accessibility checks. |

## Security contract now enforced in source

- Per-entity allowlists for events, experiences, journal stories, announcements, message status and site settings.
- Server-controlled IDs, creation/update timestamps and storage paths.
- Entity-specific status allowlists.
- URL validation limited to valid HTTP(S) URLs or safe site-relative paths.
- Text length caps and strict whole-number event capacity.
- Declared upload MIME type must match the detected JPEG/PNG/GIF/WebP signature.
- Google Photos imports use detected file bytes rather than trusting Google's declared MIME type.
- Picker polling and importing are restricted to the session owner; expired sessions cannot be imported.
- CI contract checks guard these controls against accidental removal.

## Gaps that must not be mistaken for passing features

1. The current GitHub CI performs TypeScript checks, a production frontend build, and static API/contract checks. It is **not** an end-to-end browser suite.
2. The `tests/tests.json` scenarios describe desired manual flows; their presence does not prove those flows ran.
3. Persistent editorial revision history/restore, robust media-reference protection before deletion, and true browser regression automation remain unverified/not established by the current source review.
4. The current AppDeploy QA snapshot has no reported frontend or network errors, but that snapshot alone cannot prove authenticated CMS actions, Google OAuth, storage writes, or database persistence.
5. Production must not be redeployed until the hardening PR passes CI and the live smoke tests above are completed.

## Release gate

Do not mark the app fully verified until the admin allowlist is confirmed privately, CI passes on the final hardening commit, and desktop/mobile smoke tests cover public discovery, all CMS write flows, media upload/deletion, Google Photos, and PWA behaviour.
