# Phase 3 Registration Foundation — Multi-ticket Booking Decision

**Date:** 3 November 2026  
**Status:** Accepted product decision; implementation design in progress  
**Repository:** emeriem/urban-life-co  
**Release status:** GitHub-only work. No deployment, payment activation, or production configuration.

## 1. Confirmed booking rule

A customer may purchase **any number of tickets in one booking**. The booking is the checkout/payment container; each ticket represents one attendee and consumes one unit of event capacity.

This is not a group-size-limited booking flow. The customer may add multiple attendees to one checkout, subject to event availability and any operational limits that may later be configured for abuse prevention.

## 2. Required customer experience

- The customer chooses an event and ticket quantity.
- The checkout captures purchaser contact details once.
- It captures the required attendee details separately for every ticket.
- The customer reviews the complete quantity and total before initiating payment.
- One booking may contain many ticket records.
- After confirmed payment, each attendee receives a distinct ticket identifier and QR credential.
- Ticket validation/check-in is performed per ticket, not per booking.
- A partial or failed payment must not issue valid tickets.

The exact attendee fields (for example, name, email and phone) remain a product decision and should be kept to the minimum needed for event operations.

## 3. Capacity and concurrency invariants

1. One ticket consumes exactly one unit of event capacity.
2. A booking for quantity N reserves N units, never one unit for the whole booking.
3. Capacity allocation must be atomic. Concurrent bookings must not push confirmed plus active-held quantity above the event capacity.
4. The server calculates price and total from trusted event/ticket configuration; it never accepts a client-calculated total as authoritative.
5. Expired or cancelled holds release their full quantity exactly once.
6. A payment confirmation, cancellation, expiry, or webhook replay must not apply the same state transition twice.
7. Ticket issuance is idempotent: retrying a successful payment notification must not create duplicate tickets.
8. A booking must retain a stable request/idempotency identifier across client retries. Replays must verify that the purchaser and payload match the original request.

## 4. Proposed records

The following are logical record types, not existing production collections:

- **Event inventory:** event ID, capacity, confirmed quantity, held quantity, and version/state needed for conditional updates.
- **Booking:** purchaser details, event ID, quantity, amount/currency snapshot, payment method, lifecycle status, expiry, and stable request ID.
- **Attendee/ticket:** booking ID, event ID, attendee details, unique ticket ID, QR token hash, and check-in status/time.
- **Payment attempt:** booking ID, provider-neutral provider reference, method, amount/currency, status, and reconciliation metadata.
- **Idempotency receipt:** stable request ID, owner/payload fingerprint, and resulting booking/payment state.
- **Audit event:** actor, action, target, timestamp, and relevant before/after state.

Do not store raw card data. Card entry is outside the approved initial checkout. Do not treat transfer screenshots or customer-entered references as proof of payment.

## 5. Transaction and recovery requirements

The AppDeploy database SDK reference documents db.tx.add, conditional db.tx.update, increment, and db.transact. The implementation must use fresh, unconsumed transaction handles for each attempt and commit capacity, booking, attendee/ticket, and receipt changes atomically where the transaction action limit permits.

Important SDK constraints to design around:

- A transaction commits all actions or none; maximum 100 application actions and 4 MiB.
- Duplicate physical targets reject a transaction.
- Conditional patch updates require an existing record and fail the transaction when the condition is not met.
- A transaction with an unknown outcome must be reconciled using the original receipt; it must not be blindly retried with a new request ID.
- Database reads are not a transaction-wide snapshot. Incomplete reads are unresolved, not evidence of absence.
- Per-app database quotas must surface; quota errors must not be hidden or retried as ordinary conflicts.
- Large attendee lists and evidence files must not be embedded in oversized database records.

For large quantities, implementation must explicitly handle the 100-action/4 MiB limits without splitting a single capacity reservation into unsafe partial commits. A safe initial maximum quantity may be required as an operational guardrail, but it must be configurable and must not silently contradict the customer's no-fixed-group-size requirement.

## 6. Payment lifecycle

The initial checkout supports:
- Automated bank transfer, subject to provider sandbox validation.
- USSD, subject to provider sandbox validation and bank coverage.
- Manual bank transfer as a fallback, with booking status pending administrator verification.

Manual transfer is verified only against actual credit in the business bank account. Evidence may support investigation but does not authorize ticket issuance.

Provider selection remains open. The code should expose a provider-neutral adapter and must not assume a provider's APIs, webhook signature scheme, transfer behavior, fees, or settlement rules before sandbox validation.

A booking becomes paid only after trusted server-side verification (or explicit administrator approval for the manual-transfer workflow). Browser redirects and client-side success messages are not payment evidence.

## 7. Decisions still required before a complete checkout

- Event pricing model and authoritative price/currency fields.
- Required attendee fields and whether purchaser may be an attendee without re-entering details.
- Expiry duration for unpaid capacity holds.
- Cancellation/refund policy and post-payment cancellation behavior.
- Manual-transfer evidence handling, retention and admin review process.
- Payment provider and proven USSD bank coverage.
- Operational anti-abuse quantity ceiling/rate limits. This is not a group booking cap; it is a system protection control.

Bank settlement details and payment credentials must be configured through secure settings/secrets, never pasted into source code or committed to GitHub.

## 8. Acceptance criteria

- One checkout can contain multiple attendees/tickets.
- The total equals the server-calculated unit price multiplied by the ticket quantity (or the applicable trusted tier calculation).
- Capacity is reserved for the full quantity atomically.
- Concurrent requests cannot oversell capacity.
- A retry with the same idempotency key does not create a second booking or charge.
- A webhook replay does not duplicate payment transitions or tickets.
- Each paid attendee receives a unique ticket/QR credential.
- Each ticket can be checked in only once unless an authorized reversal workflow is explicitly implemented.
- Manual transfer remains pending until an administrator verifies the bank credit.
- No ticket is issued for an unverified or failed payment.
- No production deployment occurs without an explicit user request.

## 9. Current implementation status

This file records the accepted multi-ticket requirement and the engineering constraints. It does not claim that registration, payment, capacity reservation, ticket issuance, or check-in has been implemented. Those changes require code, tests, provider sandbox evidence, and review in subsequent commits/PRs.
