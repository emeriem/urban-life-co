# Urban Life Co. Phase 3 — Sandbox Test Plan

**Environment:** isolated AppDeploy staging app only
**Production policy:** do not change production source, secrets, database, cron jobs or deployment as part of this plan.
**Currency:** NGN; monetary values are stored in kobo (minor units).

## 1. Staging prerequisites
- Deploy a staging copy with a distinct AppDeploy app ID, database and secret scope.
- Configure staging-only ADMIN_EMAILS for the designated test administrator.
- Configure synthetic event records; never copy production attendee, customer or payment records into staging.
- Configure staging-only manual-transfer account details only if the owner supplies a test receiving account.
- Obtain Flutterwave test-mode public/secret keys and webhook hash through AppDeploy's secure secret-entry workflow.
- Verify the staging callback/webhook URL and signature handling before enabling any provider adapter.
- Set event capacity and price to known values; label every event clearly as a test.
- Ensure no test payment can settle to a real receiving account and no customer-facing production event is modified.

## 2. Registration and inventory acceptance matrix
| ID | Scenario | Expected result |
|---|---|---|
| REG-01 | One purchaser books 3 attendees | One booking, one payment reference, 3 named attendee tickets and total = unit price × 3 |
| REG-02 | Submit same idempotency key and identical payload twice | Original booking is returned; no additional hold, payment attempt or ticket |
| REG-03 | Reuse idempotency key with changed attendee/purchaser/event data | HTTP 409; no new booking |
| REG-04 | Two concurrent requests compete for the last available ticket | At most one succeeds; event inventory never exceeds capacity |
| REG-05 | Request quantity greater than remaining capacity | HTTP 409; no partial booking |
| REG-06 | Simulate transaction conflict | No partial booking/receipt/payment/ticket rows; caller can safely retry same request key |
| REG-07 | Simulate unknown transaction outcome | Reconcile through original request receipt; never create a second booking blindly |
| REG-08 | Large multi-ticket booking near transaction ceiling | Either full atomic booking within limits or clear HTTP 413; never partial tickets |
| REG-09 | Edit event title/date/price/capacity while bookings exist | CMS patch does not overwrite held, confirmed or checked-in counters |
| REG-10 | Attempt to archive event while a booking is in progress | Verify policy and ensure no new booking after archive; existing paid tickets remain valid |

## 3. Manual bank-transfer acceptance matrix
| ID | Scenario | Expected result |
|---|---|---|
| PAY-01 | Paid event without staging bank details | Checkout fails closed with HTTP 503 |
| PAY-02 | Submit transfer reference | Booking becomes manual_review; tickets remain inactive |
| PAY-03 | Try administrator confirmation without actual-credit assertion | HTTP 400; no ticket issuance |
| PAY-04 | Enter amount lower or higher than booking total | HTTP 409; no ticket issuance or inventory release |
| PAY-05 | Verify exact bank credit and audit note | One atomic transition to confirmed; one ticket per attendee; held count moves to confirmed |
| PAY-06 | Submit duplicate confirmation concurrently | Only one transition and one inventory movement succeeds |
| PAY-07 | Reject transfer reference | Rejection reason and actor are audited; tickets remain inactive; hold remains until expiry or separately approved handling |
| PAY-08 | Late credit after expiry | No automatic ticket issue; route to documented manual reconciliation and refund/exception process |
| PAY-09 | Overpayment, underpayment, duplicate credit or wrong narration | No automatic confirmation; reconciliation case required |
| PAY-10 | Retry after uncertain confirmation response | Read booking status before any further action; no duplicate tickets or counter movement |

## 4. Provider sandbox acceptance matrix (Flutterwave candidate)
Do not enable the provider until the current Flutterwave test account and current API documentation confirm the required Nigeria channels.

| ID | Scenario | Expected result |
|---|---|---|
| FW-01 | Create test NGN bank-transfer instruction | Provider reference and expiry are stored; booking remains pending |
| FW-02 | Complete test transfer using provider sandbox instructions | Valid signed event or server-side verification moves payment to success exactly once |
| FW-03 | Invalid webhook signature | HTTP 401/403; no state change |
| FW-04 | Replay same valid webhook | Idempotent acknowledgement; no duplicate issuance |
| FW-05 | Valid webhook with wrong amount/currency/reference | Quarantined for reconciliation; no tickets |
| FW-06 | Query provider transaction after browser closes | Server-side verification recovers state; browser redirect is not trusted |
| FW-07 | USSD initiation for each bank in the approved test-bank matrix | Correct bank selection and USSD instructions; only verified payment issues tickets |
| FW-08 | Cancel, fail or expire provider transaction | Booking remains unpaid and releases capacity once at expiry |
| FW-09 | Provider API timeout / unknown outcome | Reconcile by merchant reference before retrying create-charge |
| FW-10 | Provider test webhook sent more than once/out of order | Monotonic, idempotent state transitions; no downgrade from succeeded |

## 5. Ticket and check-in acceptance matrix
| ID | Scenario | Expected result |
|---|---|---|
| TKT-01 | Confirm a 3-attendee booking | Exactly 3 tickets issued |
| TKT-02 | Try retrieving booking with wrong access token | HTTP 403; no attendee or ticket data disclosed |
| TKT-03 | Reload browser / use saved booking access | Customer can recover booking status and ticket pages |
| TKT-04 | Load multiple ticket batches | No duplicates or missing tickets; batch navigation remains stable |
| TKT-05 | Scan or paste QR payload | Correct ticket credential is resolved and checked in |
| TKT-06 | Check in same ticket twice | First request succeeds; second returns HTTP 409 |
| TKT-07 | Two admins check in same ticket simultaneously | Exactly one succeeds; checked-in count increments once |
| TKT-08 | Check in pending, expired or unknown ticket | Rejected; no attendance counter change |
| TKT-09 | Unknown outcome on check-in | Read ticket state to reconcile before retry |

## 6. Expiry acceptance matrix
| ID | Scenario | Expected result |
|---|---|---|
| EXP-01 | Pending booking reaches hold expiry | Booking/payment attempt expire and held count decreases exactly once |
| EXP-02 | Cron retries same expired booking | No second inventory decrement |
| EXP-03 | Manual review is pending at expiry | Hold expires; late transfer is handled through exception process |
| EXP-04 | More than 100 bookings exist | Cursor advances and eventually revisits the full bounded list without permanently skipping records |
| EXP-05 | More than 20 expired bookings in one run | Work is checkpointed; remaining records are processed on later runs |
| EXP-06 | Expiry races with bank-credit confirmation | Exactly one conditional transaction wins; counters and booking state remain consistent |

## 7. Community and administration acceptance matrix
| ID | Scenario | Expected result |
|---|---|---|
| CRM-01 | Signup without consent | Rejected; no subscriber record |
| CRM-02 | Valid consent signup | One record with timestamp and consent version |
| CRM-03 | Same email signs up again | One record is updated; no duplicate |
| CRM-04 | Unsubscribe action races with signup | Final status follows the last successful explicit consent action; audit trail retained |
| CRM-05 | Unsubscribed contact export | Excluded from active mailing export |
| CRM-06 | More than 100 subscribers | Admin can page through every record and export the complete active list |
| CRM-07 | Unauthenticated/non-admin accesses subscriber or booking list | HTTP 401/403 |
| CRM-08 | CSV contains commas, quotes or spreadsheet formulas | Correct CSV escaping and formula-injection-safe export |

## 8. Exit criteria
- All applicable tests pass in staging and test-mode provider logs are retained without exposing secrets.
- No over-capacity state, duplicate booking, duplicate ticket issuance or duplicate check-in counter increment.
- Every payment success is backed by a valid provider verification/webhook or independently verified bank credit.
- Failed, rejected and expired payments do not issue tickets.
- Expiry and late-payment exception handling are demonstrated.
- No production data or real-money payment is used in the test.
- Security review, Nigerian privacy/legal review, refund/cancellation and retention policies are approved.
- Separate production release approval is obtained before any production deployment.

## 9. Business decisions still required
Do not invent or publish these values:
- Event cancellation and refund policy, including cutoff and refund timelines.
- Treatment of late transfers, underpayments, overpayments and duplicate transfers.
- Final payment provider and supported USSD bank list after sandbox evidence.
- Membership tiers, eligibility, benefits, price, billing period, cancellation and renewal rules.
- Community broadcast frequency, sender identity, consent language, unsubscribe channel and retention schedule.
- Approved production receiving account and payment settlement/reconciliation owner.