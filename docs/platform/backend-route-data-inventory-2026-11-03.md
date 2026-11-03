# Backend Route & Data Inventory — 3 November 2026

**Source:** AppDeploy snapshot `1793689248399`, `backend/index.ts`  
**App:** `urban-life-co-zk9nyq`  
**Status:** Static source inventory. Not an end-to-end test, penetration test, or proof of production behavior.

## Access model

- Admin routes use `requireAuth()` and `requireAdminFromSecret`.
- `requireAdminFromSecret` reads `ADMIN_EMAILS` from AppDeploy secrets and fails closed if the secret is missing or empty.
- Public routes have no explicit admin middleware.
- This remains a single-admin allowlist pattern. It is not a multi-role or multi-tenant authorization model.

## Route catalogue

| Method | Route | Access | Purpose / data |
|---|---|---|---|
| GET | `/api/_healthcheck` | Public | Basic health response |
| GET | `/api/content` | Public | Published events, stories, experiences, active announcement and site settings |
| GET | `/api/events/:id` | Public | Non-draft, non-archived event detail |
| GET | `/api/stories/:id` | Public | Published story detail |
| GET | `/api/experiences/:id` | Public | Published experience detail |
| POST | `/api/messages` | Public | Validate and persist contact enquiry; honeypot, email validation and basic per-email throttling; attempts Resend alert |
| GET | `/api/media` | Admin | List media metadata and signed URLs |
| GET | `/api/admin/status` | Admin | Admin role indicator |
| GET | `/api/admin/dashboard` | Admin | CMS metrics and recent content/message counts |
| GET / POST / PUT / DELETE | `/api/admin/events`, `/api/admin/events/:id` | Admin | Event list, create, update and soft archive |
| GET / POST / PUT / DELETE | `/api/admin/experiences`, `/api/admin/experiences/:id` | Admin | Experience list, create, update and soft archive |
| GET / POST / PUT / DELETE | `/api/admin/stories`, `/api/admin/stories/:id` | Admin | Story list, create, update and soft archive |
| GET / POST / PUT / DELETE | `/api/admin/announcements`, `/api/admin/announcements/:id` | Admin | Announcement list, create, update and soft archive |
| GET / PUT | `/api/admin/messages`, `/api/admin/messages/:id` | Admin | List enquiries and update message status |
| GET / PUT | `/api/admin/settings` | Admin | Read and update global site settings |
| POST / DELETE | `/api/admin/media/upload`, `/api/admin/media/:id` | Admin | Upload and delete media objects/metadata |
| GET | `/api/admin/google-photos/config` | Admin | Google Photos Picker configuration |
| POST | `/api/admin/google-photos/session` | Admin | Create picker session and persist owner/context |
| POST | `/api/admin/google-photos/session/:sessionId/status` | Admin | Check picker session; source verifies stored session ownership |
| POST | `/api/admin/google-photos/import/:sessionId` | Admin | Import selected images, create media metadata and clean up picker session |

## Collections and storage

| Collection/resource | Observed use |
|---|---|
| `events` | Public event content, admin CRUD/archive, seed events |
| `experiences` | Public experience content, admin CRUD/archive, seed experiences |
| `stories` | Public journal content, admin CRUD/archive, seed stories |
| `announcements` | Public active announcement and admin CRUD/archive |
| `messages` | Public contact submissions and admin message management |
| `site_settings` | Global homepage/site settings |
| `media` | Media metadata; files stored in AppDeploy object storage |
| `google_photos_picker_sessions` | Picker session ownership, event/experience context and expiry |

No registration, attendee, payment, transaction, refund, ticket, check-in, or waitlist collections/routes were found in this snapshot's backend source. The event model currently exposes `registrationLink` and `capacity`; these are event metadata and do not constitute a registration or payment system.

## Findings and implementation constraints

1. **No native event registration flow:** the frontend currently renders an external registration link when an event has `registrationLink`.
2. **No payment processing:** no provider adapter, payment initiation, webhook, server-side transaction verification, or reconciliation route is present.
3. **No waitlist/ticket/check-in system:** no waitlist, ticket issuance, QR validation, or attendance workflow is present.
4. **Capacity is only metadata today:** `capacity` is editable event metadata. It is not protected by a reservation ledger or concurrency-safe allocation.
5. **Single-operator admin access:** admin routes rely on an email allowlist secret, not a granular permission model.
6. **Shared single-brand collections:** no tenant/workspace scoping was identified. Do not onboard separate brands as tenants until server-side isolation is designed and tested.
7. **Manual transfer must be a controlled admin workflow:** customer references or screenshots must remain unverified until an administrator independently confirms the credit in the business bank account.
8. **Payment provider remains undecided:** bank transfer and USSD support must be proven in sandbox. Card collection is excluded from the approved initial checkout.

## Phase 3 technical gates

- Model registration, payment attempts, capacity holds, idempotency receipts and audit events separately.
- Use the AppDeploy database SDK's documented transactions/conditional updates for atomic capacity and state changes; test conflicts and unknown outcomes.
- Use server-side provider verification and signed webhook validation; never trust browser redirects or client success state.
- Restrict manual-transfer evidence to authorized administrators; define secure retention and deletion.
- Issue a ticket only after confirmed provider payment or approved free registration.
- Refresh this inventory when routes or collections change and attach actual CI/browser/sandbox evidence to the implementation PR.

## Release guardrail

This inventory is source documentation only. No production data, configuration, secrets, payment activation, merge, or deployment is authorised by this document.
