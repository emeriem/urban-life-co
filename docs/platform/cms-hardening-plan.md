# CMS Hardening Plan

**Status:** Implementation contract; verify against the reconciled AppDeploy/GitHub source before coding.  
**Scope:** Single-brand Urban Life Co. CMS reliability. Multi-brand tenant isolation is a separate gate and must precede external brand onboarding.

## Product outcome

An authorised editor can manage public content safely without editing code. Changes persist across refreshes; publication state is explicit; invalid or unauthorised writes are rejected on the server; media operations are recoverable and tested.

## CMS modules

1. **Dashboard** — actionable counts and recent activity; counts must derive from persisted records.
2. **Content library** — unified search and filters across supported content types, with clear status and pagination.
3. **Events** — create, edit, preview, draft, publish, archive and restore where supported.
4. **Experiences** — create, edit, preview, draft, publish, archive and restore where supported.
5. **Journal / stories** — structured editorial fields, draft/publish, stable public URL, validation and revision history.
6. **Announcements** — message, priority and optional active window; explicit status and expiry behaviour.
7. **Media library** — direct upload, Google Photos import, asset details, reference-aware removal and recoverable failure handling.
8. **Site content/settings** — controlled editing of global homepage fields, separate from individual content.
9. **Messages** — review enquiries, update status, and protect contact information.

Do not imply comments, taxonomy persistence, revision history, previews or restore are implemented until the backend and UI both support them.

## Content lifecycle contract

| State | Meaning | Public visibility |
|---|---|---|
| Draft | Work in progress; not approved for visitors | Never public |
| Published | Approved and eligible for display | Public routes may return it if other publication/date rules pass |
| Archived | Removed from active editorial use | Never public |

- Validate allowed state transitions on the server.
- Never trust client-supplied IDs, ownership fields, or creation/update timestamps.
- Archive should be non-destructive where possible; permanent deletion needs a separate, deliberate operation.
- Restore semantics must be explicit and tested.
- A save must report failure if persistence fails; the UI must not claim success early.
- Avoid silent data loss: protect unsaved changes and show actionable errors.

## Server-side data contracts

For every create/update route:

- Validate request body type and required fields.
- Use an explicit allowlist of writable fields per content type.
- Trim and bound strings; validate dates, URLs, enums, numbers and optional values.
- Set IDs, timestamps and internal fields on the server.
- Reject unknown or immutable fields rather than silently accepting them.
- Return consistent error codes/messages and handle missing records.
- Test unauthorized requests, malformed bodies, invalid status, unknown fields and missing records.
- Keep public route filtering separate from admin list behaviour; draft/archived data must never leak through public list or detail routes.

The exact field schema must be derived from the current reconciled source and existing production data, not invented from the UI.

## Editorial experience requirements

- Search and filter by type/status; sort and paginate records.
- Show loading, empty, saving, saved and error states.
- Disable duplicate submissions while a write is pending.
- Validate required fields before publish and return field-specific errors.
- Preserve user input after network/server failure.
- Provide a preview that reflects the public presentation where feasible.
- Use accessible labels, keyboard navigation, visible focus, and mobile-friendly controls.
- Revision history must be stored durably with timestamps and actor identity where supported. Restore must create a new revision rather than erase history.

## Media safety

- Enforce byte-size limits and verify file signatures/MIME server-side.
- Use safe generated storage keys; do not trust filenames as paths.
- Handle partial failures between object storage and metadata persistence.
- Check references before removal; explain which content uses an asset.
- Require confirmation for destructive actions.
- Test upload, list, URL resolution, import cancellation/retry, delete failure and orphan cleanup.
- Never expose Google Photos tokens or secret values in logs or client responses.

## Required regression scenarios

1. Unauthenticated and non-admin users cannot perform any admin read/write.
2. Valid content can be created, edited, published and archived.
3. Invalid/incomplete content is rejected by the server.
4. Draft and archived content are absent from public lists and detail endpoints.
5. Changes survive reload and appear consistently on the public site.
6. Failed saves preserve editor input and clearly show failure.
7. Unknown/immutable fields cannot override server-controlled data.
8. Older content remains findable through search/pagination.
9. Media upload/import/removal failures do not leave silent orphan records or broken references.
10. Site settings save and reload correctly.
11. Mobile and keyboard journeys remain usable.
12. Revision history and restore pass only after implemented end-to-end; no mocked success.

## Delivery gates

### Gate 0 — Establish source truth
- Compare the current AppDeploy snapshot with GitHub `main` file by file.
- Recover required approved assets and verify config/resource paths.
- Record a known-good AppDeploy recovery point.
- Do not overwrite production source from an incomplete GitHub copy.

### Gate 1 — Secure and standardise persistence
- Implement schema validation and writable-field allowlists.
- Add route-level tests for auth, validation and public visibility.
- Keep changes small and reviewed.

### Gate 2 — Make editorial workflows reliable
- Complete create/edit/save/publish/archive flows and loading/error states.
- Align test definitions with implemented behaviour.

### Gate 3 — Media and revision integrity
- Harden upload/delete/import workflows.
- Add durable revisions and recovery only with a confirmed data model.

### Gate 4 — Browser verification
- Execute real browser tests for desktop and mobile critical paths.
- Record evidence, fix failures, and rerun.

### Gate 5 — Release
- Review the PR and CI.
- Verify AppDeploy resources and environment configuration.
- Require explicit owner approval before production deployment.

## Constraints

- Use GitHub and AppDeploy only unless the owner explicitly approves otherwise.
- Never deploy production as part of a source-audit or documentation change.
- Do not onboard other brands until server-side tenant isolation is designed, implemented and tested.
