# Urban Life Co. — Membership and Communications Decisions

**Status:** product-design proposal only; no paid membership or broadcast campaign has been activated.

## 1. Membership model to approve

### Recommended structure (proposal, not approved configuration)

| Tier | Intended role | Candidate benefits | Price / billing |
|---|---|---|---|
| Community | Free entry point | Community updates, public event discovery and standard registration | Free; no recurring charge |
| Member | Core paid membership | Member profile, member-only event access where offered, early registration window and a clearly defined event discount or member rate | Owner must set NGN price and billing period |
| Premium Member | Higher-engagement tier | Member benefits plus a small, explicitly costed set of premium experiences or priority access | Owner must set NGN price and billing period |

Do not publish this tier structure until the owner confirms the tier names, eligibility, benefits, prices, billing periods and whether membership renews automatically.

## 2. Required membership rules

- Membership term: monthly, annual, fixed season, or one-time lifetime purchase.
- Renewal: automatic or manual; define reminder and failed-renewal handling.
- Cancellation: immediate or end-of-term; define refund treatment.
- Event benefits: specify discount amount/percentage, excluded events, booking limits and whether benefits can be combined.
- Capacity: member priority windows must not oversell event capacity; inventory remains subject to the same atomic booking ledger.
- Identity: decide whether a member account is required or membership can be accessed by verified email/magic link.
- Household/group: decide whether membership covers one person or multiple named people.
- Refunds: define pro-rata or no-refund policy, statutory exceptions and how paid events already booked are treated.
- Tax and receipts: confirm invoice/receipt requirements with the finance owner.

## 3. Recommended implementation sequence

1. Approve the membership rules and price table.
2. Add membership records and status lifecycle (pending, active, past_due, cancelled, expired).
3. Integrate subscription/renewal only after the provider and renewal support are validated.
4. Add member entitlement checks to event registration server-side; never trust a client-submitted membership flag.
5. Add admin member management, payment reconciliation, audit history and cancellation controls.
6. Test renewal failure, cancellation, refund, duplicate webhook and access revocation in staging.

## 4. Community communications

Community signup and unsubscribe capture already exist. Automated broadcast delivery is not yet connected.

Before activating campaigns, approve:
- Sending domain and sender address controlled by Urban Life Co.
- Display name and reply-to mailbox monitored by the team.
- Expected cadence (for example, monthly digest; this is a proposal, not a default).
- Categories subscribers can select and whether event promotions are included.
- Consent wording and proof-of-consent record requirements.
- Unsubscribe mechanism, suppression handling and complaint/bounce management.
- Retention period for active contacts and opt-out suppression records.
- Who can create, approve and send campaigns.

Resend is already present in the app's configuration, but the current sender value is the Resend onboarding sender. A verified Urban Life Co. sending domain is required before branded production broadcasts should be enabled. Do not send campaigns to the community list until the sender domain, consent language and approval workflow are confirmed.

## 5. Proposed campaign controls

- Draft → reviewed → approved → scheduled/sent lifecycle.
- Preview and send-to-self test before each campaign.
- Recipient audience built only from active, consented subscribers.
- Exclude unsubscribed, bounced and complained addresses.
- Paginated audience selection and bounded batch sends.
- Idempotent campaign recipient records to prevent duplicate sends.
- Audit who approved and sent each campaign.
- Per-campaign delivery, bounce and unsubscribe reporting.

## 6. Owner decisions needed before implementation

1. Approve or revise the proposed membership tiers and their benefits.
2. Set the NGN price and billing period for each paid tier.
3. Decide renewal, cancellation, refund and member eligibility rules.
4. Confirm the Urban Life Co. sending domain and sender mailbox.
5. Confirm broadcast cadence, content categories and campaign approver.