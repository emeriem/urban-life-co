# Phase 3 — Event Registration & Payment Design

**Status:** Approved scope; technical design in progress  
**Scope approval:** Bank transfer and USSD, plus manual bank-transfer fallback verified by an administrator  
**Provider decision:** Open. Keep the payment integration provider-neutral until sandbox testing supports a final selection.  
**Production deployment:** Explicitly out of scope. No deployment or production configuration changes are authorised by this document.

## 1. Approved customer payment experience

The initial checkout must offer:

1. **Automated bank transfer** — a payment provider creates or supplies the transfer instructions/reference for the specific registration. The customer transfers from their banking app. The app confirms registration only after trusted server-side payment verification.
2. **USSD** — the customer selects a supported bank and follows the provider/bank instructions to authorise payment using their bank's USSD flow. The website must not request card details or a card PIN.
3. **Manual bank transfer fallback** — the app displays the business's approved bank account details and a unique payment reference. The customer may submit a transfer reference and optional proof for administrative review. An administrator must independently verify funds received in the business bank account before marking the payment as paid.

**Card payments are excluded from the initial checkout.** Do not collect, store, transmit, or request card numbers, CVV, expiry dates, or card PINs anywhere in this flow.

## 2. Current-state evidence and gap

The current source contains event metadata fields including `registrationLink` and `capacity`. The backend route/data inventory currently lists public event reads and admin event CRUD, but no registration, payment, waitlist, attendance, or payment-webhook routes/collections.

This is a source-level finding, not proof about uninspected live runtime configuration. Reconcile the deployed AppDeploy source with GitHub before implementing against the repository.

## 3. Provider-neutral architecture

Separate registration and payment domain logic from the payment provider adapter.

### Domain services

- **Registration service:** validates event eligibility, attendee details, price, capacity, duplicate registrations and reservation expiry.
- **Capacity service:** atomically allocates and releases temporary holds and confirmed places. Prevent overselling under concurrent requests.
- **Payment orchestration service:** creates a payment attempt, stores the selected method and provider-neutral reference, handles expiry, and reconciles payment outcomes.
- **Provider adapter interface:** supports capability discovery, bank-transfer instruction creation, USSD initiation, transaction verification, webhook signature verification and provider status mapping. A provider-specific adapter must not leak provider response formats into the registration domain.
- **Manual reconciliation service:** records customer-submitted transfer references/proof as unverified evidence and supports administrator approval/rejection with an audit trail.
- **Ticket/check-in service:** issues a unique ticket/QR credential only after confirmed payment (or an explicitly approved free registration) and validates check-in without exposing personal data in the QR payload.

### Suggested provider adapter contract

The exact implementation should be selected after reviewing the AppDeploy runtime SDK and provider sandbox behavior. The conceptual contract should cover:

- `getCapabilities()` — supported currencies, banks, transfer and USSD availability.
- `createBankTransfer()` — create a transfer instruction/payment attempt.
- `initiateUssd()` — initiate a supported USSD transaction.
- `verifyTransaction()` — verify status, amount, currency and merchant reference server-side.
- `verifyWebhook()` — authenticate webhook origin/signature and parse a normalized event.
- `normalizeStatus()` — map provider states to internal payment states.

Never trust a browser redirect, client-side success message, screenshot, or customer-supplied transaction reference as proof of payment.

## 4. Proposed lifecycle and state model

### Registration

- `pending_payment` — registration created; a temporary capacity hold exists.
- `confirmed` — payment verified, or an approved free registration is complete.
- `waitlisted` — event has no available capacity and waitlisting is enabled.
- `expired` — payment window elapsed without verified payment; capacity released.
- `cancelled` — cancelled under the event's published policy.
- `refunded` — refund completed and reconciled, where refunds are later supported.

### Payment

- `created`
- `awaiting_customer`
- `pending_verification`
- `succeeded`
- `failed`
- `expired`
- `cancelled`
- `manual_review`
- `manually_confirmed`
- `manually_rejected`

State transitions must be explicit, validated server-side, idempotent, and timestamped. A late success notification after a reservation has expired must enter a reconciliation path; it must not silently overbook an event.

## 5. Capacity, duplicate and expiry controls

- Reserve capacity atomically when a registration/payment attempt is created.
- Set a configurable payment expiry window and display a clear countdown/instruction.
- Release a hold when payment expires or fails, subject to a safe late-payment reconciliation rule.
- Use idempotency keys for registration creation, payment initiation and webhook processing.
- Enforce uniqueness for a registration's merchant reference and provider transaction reference.
- Prevent duplicate attendee/event registrations according to an owner-approved policy.
- Support an event capacity limit and a separate waitlist limit.
- Do not treat a client-side capacity check as authoritative.

The AppDeploy database's available atomic/transactional primitives must be verified before promising race-safe inventory. If they are insufficient, choose a safe reservation strategy before implementation.

## 6. Manual bank-transfer controls

Manual transfer is a fallback, not automatic payment confirmation.

- Display only bank account details explicitly supplied and approved by the business owner.
- Generate a unique reference per payment attempt; instruct customers to include it in the transfer narration where supported.
- Allow the customer to submit a transfer reference and optional proof upload, clearly labelled **Pending verification**.
- Store proof securely with restricted admin access and retention rules; do not expose it in public event APIs.
- Admin review must show event, amount due, customer, reference, submitted time and evidence.
- Require the administrator to verify the actual credit in the business bank account independently.
- Record reviewer identity, decision, timestamp and reason. Do not allow a customer to set their own payment status.
- Provide a rejection/retry path and a way to resolve duplicate, partial, overpayment and late-payment cases.

Bank account details, payment windows, manual-review service levels, refund/cancellation policy and evidence retention remain owner decisions.

## 7. USSD and bank-transfer user experience

- Show only banks and methods returned as currently supported by the selected provider adapter.
- Explain whether USSD opens a dialer, displays a code, or requires another customer action; do not assume identical behavior across banks/devices.
- Provide a clear fallback to bank transfer if USSD is unavailable.
- Never ask the customer to enter their bank PIN, OTP, card PIN, or card credentials into Urban Life Co.
- Show pending status until server-side verification succeeds. Provide a safe refresh/status-check action.

## 8. Security, privacy and audit requirements

- Keep provider secret keys and webhook secrets in server-side secret storage only.
- Verify webhook signatures before processing; reject invalid signatures.
- Fetch/verify transaction details server-to-server and compare expected amount, currency, merchant reference and event/registration association.
- Make webhook processing idempotent and resilient to duplicate/out-of-order delivery.
- Rate-limit public registration and payment-initiation endpoints.
- Validate and cap all customer input; avoid logging bank details, tokens, full webhook payloads or uploaded proof contents.
- Apply admin authorization to manual payment review, event reconciliation and exports.
- Keep an append-only payment/registration audit history for status changes and admin actions.
- Define data minimisation, retention, access, deletion and incident-handling rules before production use.

## 9. Sandbox evaluation gate before provider selection

Evaluate at least one provider sandbox against the same test matrix. Do not select a provider based only on marketing pages.

| Test | Acceptance criteria |
|---|---|
| Bank transfer initiation | A unique, registration-bound instruction/reference is created and shown clearly |
| Bank transfer success | Server-side verification confirms exact amount, currency and reference |
| Bank transfer failure/expiry | Registration hold is safely released |
| USSD availability | Supported Nigerian banks/methods are discoverable and accurately presented |
| USSD success/cancel/timeout | Each outcome maps to the correct internal state |
| Webhook authenticity | Valid signature accepted; invalid signature rejected |
| Duplicate/out-of-order webhook | No duplicate confirmation, ticket or capacity allocation |
| Amount mismatch | Registration remains unconfirmed and is flagged for reconciliation |
| Late payment | No silent oversell; explicit exception workflow |
| Provider outage | Customer sees a recoverable pending/error state; manual fallback remains available |
| Settlement/reconciliation | Merchant can reconcile provider records against bank settlement |
| Fees and settlement timing | Actual merchant pricing, settlement timing and any reserves/limits are documented |

Record evidence, provider sandbox account requirements, supported banks, transaction limits, fees, settlement timing, webhook retry behavior and unresolved risks. Only then recommend a provider.

## 10. Dependencies and decisions still required

- Reconcile the exact AppDeploy production source with GitHub before code changes; the architecture audit previously identified source drift.
- Confirm AppDeploy backend/database support for atomic capacity holds and secure proof storage.
- Confirm event pricing model: fixed price, free, or future tiers/discounts.
- Confirm whether registration is individual-only or supports group bookings.
- Confirm event cancellation/refund policy and treatment of provider fees.
- Obtain approved business bank account details only when manual transfer configuration is ready.
- Define admin roles permitted to verify manual transfers.
- Confirm customer receipt/confirmation channel and operational support contact.
- Complete privacy/legal review of registration and payment data handling.

## 11. Delivery sequence

1. Reconcile source and runtime; verify existing event CRUD and admin access.
2. Finalise registration/payment domain model and database guarantees.
3. Implement provider-neutral registration, capacity and payment state services.
4. Implement manual transfer review with audit controls.
5. Add a sandbox adapter for the shortlisted provider(s); keep card capability disabled.
6. Run the complete sandbox acceptance matrix and document the provider decision.
7. Complete browser/mobile QA, security review and operational runbook.
8. Present a release candidate for explicit owner approval.

**Release guardrail:** This design authorises planning and review only. It does not authorise production secrets, production bank details, payment activation, merging, or deployment. The user has explicitly instructed that no deployments occur unless separately requested.
