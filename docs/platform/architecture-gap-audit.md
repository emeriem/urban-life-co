# Urban Life Co. Platform — Architecture & Gap Audit
**Audit note · Version 0.2 · 26 October 2026**

This is an initial, source-based audit of the current AppDeploy snapshot and GitHub main branch. It is not a full security assessment or end-to-end QA.

## 1. Current baseline
- Live app: https://urban-life-co-zk9nyq.v2.appdeploy.ai/
- AppDeploy app ID: urban-life-co-zk9nyq
- Snapshot inspected: 1793038200898 (reported Ready)
- GitHub repository: https://github.com/emeriem/urban-life-co
- GitHub branch inspected: main

## 2. Capabilities visible in the current source
- Public-facing progressive web app with pages for home, about, experiences, events, journal, community, and contact.
- Admin authentication and email allowlist checks.
- CMS operations for events, experiences, stories, announcements, messages, and site settings.
- Media upload/list/delete workflows.
- Google Photos Picker integration for selecting and importing media.
- PWA manifest, service worker, install/connection messaging, and shell caching.
- AppDeploy QA snapshot reports no frontend or network errors for that QA run; this does not equal complete end-to-end verification.

## 3. Findings and risks
### Finding A — Source-code drift (high priority)
The deployed AppDeploy snapshot and GitHub main do not match.
- src/App.tsx: AppDeploy reports 2,401 lines; GitHub main has 841.
- backend/index.ts: AppDeploy reports 836 lines; GitHub main has 114.
- src/index.css: AppDeploy reports 3,614 lines; GitHub main has 3,088.
- index.html: AppDeploy has 43 lines; GitHub main has 32.
- The backend differs materially: AppDeploy source contains Google Photos endpoints and more CMS routes; GitHub's backend appears substantially older/smaller.

**Risk:** GitHub cannot currently be assumed to be a faithful backup or source of truth for the live product. A normal code change based on main could remove live functionality.

**Action:** Establish a safe source-of-truth and recovery workflow. Preserve the live snapshot, compare current files, reconcile changes deliberately, and verify a reproducible build before feature development.

### Finding B — Multi-tenant separation is not established (critical before external onboarding)
The inspected backend uses an admin email allowlist and shared collections such as events, experiences, stories, announcements, messages, media, and site settings. No apparent tenantId, brandId, workspaceId, or organizationId fields were found in the inspected backend source.

**Risk:** This is currently structured more like a single-brand application than a proven multi-tenant SaaS platform. Adding brand workspaces at the UI layer alone would not safely separate brand data.

**Action:** Before external brand onboarding, design the tenant model and authorization boundaries. Every tenant-owned record and operation must be scoped to the active brand, and cross-tenant access must be explicitly tested.

### Finding C — Current admin access is allowlist-based
The backend checks authenticated users against an ADMIN_EMAILS secret, with a fallback email allowlist in source. The inspected status route returns a super_admin role for allowlisted users.

**Risk / limitation:** This is a useful single-operator gate but is not yet a complete role and permission system for platform operators, brand owners, editors, and support staff.

**Action:** Keep the current access path protected while designing roles, permissions, tenant membership, invitation, revocation, and audit logging.

### Finding D — Google sign-in script warning
The latest AppDeploy status response included a frontend log entry: Failed to load script - https://accounts.google.com/gsi/client.

**Status:** Needs verification. The deployment status is Ready, and the log entry alone does not prove the integration is currently broken.

**Action:** Re-test admin sign-in and Google Photos picker/import flows in a real browser and record the outcome before changing the integration.

### Finding E — PWA and test coverage
The app includes a service worker and test definitions for public discovery, admin CMS, contact/media, Google Photos, and PWA behaviour. The test definitions describe intended checks; their presence alone does not prove every workflow passed.

**Action:** Record actual test results, device/browser coverage, failure evidence, and rollback steps.

## 4. Initial priority order
1. **Protect and reconcile source code** — no large feature work until the live snapshot and repository are brought into alignment safely.
2. **Verify the running product** — smoke-test public pages, admin sign-in, content CRUD, media upload, Google Photos, and PWA behaviour.
3. **Map data and access controls** — map every collection, route, permission, and write operation.
4. **Design tenant architecture** — define brand/workspace IDs, membership and role model, data scoping, platform super-admin boundaries, and migration strategy.
5. **Only then implement multi-brand foundations** — preserve Urban Hikers as the first tenant and test isolation before inviting any external brand.

## 5. Guardrails
- No production rewrite as part of this audit.
- Do not overwrite GitHub main with a partial copy or deploy from an unverified branch.
- Preserve a known-good rollback point before implementation changes.
- Never treat a deployment-ready status as proof of full functional or security testing.
- Do not onboard external brands until tenant isolation is implemented and tested.

## 6. Next action
Continue the audit by producing a route-and-data inventory, then establish a safe source reconciliation plan. The next implementation step should be selected only after those findings are recorded.

## Confidence
This note is based on source inspection and deployment status available on 26 October 2026. It is a preliminary engineering assessment, not a penetration test, legal/compliance review, or complete production readiness certification.
