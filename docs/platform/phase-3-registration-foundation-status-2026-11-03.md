# Phase 3 — Registration Foundation Implementation Status

**Branch:** phase-3/multi-ticket-registration-foundation  
**Status:** Working implementation; not production-ready  
**Release:** No deployment, no merge to main, no production payment activation.

## Implemented in this branch

### Multi-ticket booking
- A purchaser can submit multiple attendee names in one booking.
- Each attendee receives an individual ticket record.
- One booking has a single purchaser/payment reference and a server-calculated total.
- Capacity is reserved for the full quantity using a conditional transactional event update.
- Confirmed and held quantities are tracked on the event record.
- A stable client idempotency key is stored with the booking; replayed requests with the same key and payload return the original booking.
- Ticket batches are stored separately from the booking record to avoid the 256 KiB record limit.
- A request is rejected before writing if the complete transaction would exceed the AppDeploy 100-action or 4 MiB transaction ceiling.

### Manual bank transfer
- Paid checkout is offered only when the required bank details exist in server-side secrets.
- Customer transfer references move a booking to manual_review; they do not confirm payment.
- Administrator confirmation requires an explicit actual-bank-credit assertion, an audit note, and the exact credited amount in kobo matching the booking total.
- Confirmation atomically moves held capacity to confirmed capacity and issues the pending tickets.
- Rejection is recorded with an administrator and reason.
- Manual transfer details are not hardcoded into the repository.

### Ticket operations
- Tickets are separate records with pending_payment, issued, and checked_in states.
- A protected administrator endpoint performs one-time check-in using a ticket ID.
- Customer booking access uses a high-entropy token; only its SHA-256 digest is stored.
- Unpaid holds have a scheduled expiry handler that releases held inventory and marks the booking/payment attempt expired.

### Provider-neutral checkout
- Added a provider-neutral interface for bank transfer, USSD, transaction verification and webhook verification.
- The shipped default adapter is intentionally disabled. Automated transfer and USSD must not be advertised as active until a provider passes sandbox testing and is configured.
- Card data is not collected.

### Admin UI
- Added a Bookings & tickets CMS tab.
- Administrators can inspect booking/payment references, verify actual transfer credit, reject transfer references, and enter a ticket ID for check-in.
- The admin dashboard includes confirmed tickets sold, active ticket holds, and checked-in attendance counters.
- Event detail pages provide calendar-file export, native share/copy-link behavior, and a map-search link.

## AppDeploy secrets required for manual transfer

Configure these through AppDeploy's secure secret settings, not source code or GitHub:

| Secret | Purpose |
|---|---|
| MANUAL_TRANSFER_BANK_NAME | Approved receiving bank |
| MANUAL_TRANSFER_ACCOUNT_NAME | Approved account name |
| MANUAL_TRANSFER_ACCOUNT_NUMBER | Approved account number |
| MANUAL_TRANSFER_INSTRUCTIONS | Optional customer instructions |

These values have deliberately not been invented or configured. Until all three required account secrets are set in a test environment, paid manual-transfer checkout returns a clear disabled response.

## Current limitations and release blockers

1. **Provider sandbox:** no automated bank-transfer or USSD adapter is active. Provider selection and sandbox evidence remain outstanding.
2. **Ticket QR rendering/scanning:** ticket IDs and one-time check-in API exist, but a customer-facing QR image/PDF and camera-based scanner are not yet implemented. Current check-in is by entering the ticket ID in the admin panel.
3. **Expiry execution:** the cron definition is committed, but it will not run until a separately approved AppDeploy deployment. No deployment has been made.
4. **Manual-transfer secrets:** real bank details are not in source and have not been supplied/configured.
5. **Operational policies:** refund/cancellation, late payment, transfer mismatch/overpayment, evidence retention and customer confirmation channels still require owner approval.
6. **Membership and CRM:** paid memberships/subscriptions are not implemented. The roadmap says these follow validation of requirements, providers, fees and local operating constraints.
7. **Community capture and broader analytics:** a mailing-list consent flow, communications/segmentation, conversion/retention analytics and exports are not implemented. The current branch adds only ticket sales/reservation/attendance counters.
8. **Legal/privacy review:** registration and payment data handling, retention and Nigerian privacy/legal language require review before launch.
9. **Runtime QA:** the repository CI checks frontend type/build and static API contracts; it does not execute AppDeploy database transactions or a browser end-to-end payment flow. Sandbox/concurrency tests remain mandatory.

## Required verification before production

- Run the GitHub Actions type-check, frontend build and API contract checks on this branch.
- In a non-production AppDeploy test app, test concurrent reservations at the capacity boundary, duplicate idempotency keys, transaction conflicts/unknown outcomes, expiry, late payment, webhook replay, exact amount mismatch, ticket issuance and duplicate check-in.
- Verify that a failed/expired booking releases its full held quantity exactly once.
- Complete provider bank-transfer and USSD sandbox acceptance tests.
- Implement QR ticket rendering/scanning and provide an accessible manual fallback.
- Complete privacy, security and operational runbooks.
- Obtain explicit production release approval.

**Do not interpret this branch as a live payment system.** It is a code and workflow foundation requiring the above verification and dependencies.
