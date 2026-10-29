# Urban Life Co. Platform — Vision & Execution Roadmap
**Working document · Version 0.1 · 26 October 2026**

*Live. Connect. Explore.*

## 1. Purpose
Evolve the existing Urban Life Co. progressive web app into a scalable platform that enables Urban Life Co. and, over time, other lifestyle brands and communities to create their own branded digital experiences and manage operations from shared infrastructure.

**This is an evolution of the existing work—not a reset, replacement, or abandonment of the current app.**

## 2. Product thesis
Urban Life Co. owns and operates the platform. Each participating brand should have its own branded front end, workspace, content, settings, users, and enabled features. Shared infrastructure should make the product easier to maintain while keeping each brand’s experience and data properly separated.

The goal is not to copy every feature from every successful app. It is to combine the most useful capabilities into one coherent, modular operating platform, integrating specialist services where building from scratch would be slower, riskier, or less reliable.

## 3. Intended users
- **Platform owner:** Urban Life Co. manages platform-wide configuration, onboarding, plans, permissions, support, and governance.
- **Brand administrators:** manage their brand identity, pages, content, events, members, communications, and reporting.
- **Community members and customers:** discover brands, explore experiences, register or book, receive updates, and participate.
- **Future partner brands:** organisations that need a professional digital presence and practical operating tools without building a software team.

## 4. Product principles
- Preserve and improve the current PWA; avoid unnecessary rewrites.
- Multi-brand by design: a brand must not see or control another brand’s private data.
- Modular capabilities: brands use the tools relevant to their needs.
- Premium, mobile-first experiences that account for real-world connectivity and device constraints.
- Security, permissions, backups, monitoring, and recovery are core requirements.
- Build where it creates strategic advantage; integrate proven services when sensible.
- Validate with real users and measurable outcomes before scaling.

## 5. Capability map
*Target state, not a claim of current completion.*

| Capability | Intended scope |
|---|---|
| Platform administration | Tenant onboarding, plans, feature access, platform settings, support, audit trail |
| Brand workspace | Brand profile, logo, colours, typography, navigation, pages, roles, settings |
| Publishing and media | CMS, announcements, stories, image/video library, Google Photos and other integrations |
| Experiences and events | Listings, registration, bookings, attendance, calendars, follow-up |
| Community and relationships | Member records, memberships, communications, segmentation, engagement history |
| Commerce and revenue | Payments, subscriptions, paid registrations, receipts, eligible transaction fees |
| Insights and automation | Analytics, conversion, retention, scheduled messages, workflows, exports |
| Platform foundations | Tenant isolation, authentication, permissions, integrations, monitoring, backups, recovery |

## 6. Phased roadmap
### Phase 0 — Establish the truth
- Inspect the live AppDeploy app, current source, GitHub repository, deployment process, and integrations.
- Identify what is implemented, partial, broken, duplicated, or only planned.
- Resolve source-of-truth and version-control drift before substantial feature work.
- Record risks, unknowns, and dependencies.

### Phase 1 — Secure the foundation
- Confirm authentication, roles, permissions, data boundaries, backups, logging, and recovery.
- Define brand/tenant data models and access rules before onboarding external brands.
- Protect existing Urban Hikers functionality.

### Phase 2 — Make the platform multi-brand
- Create platform-level administration and independent brand workspaces.
- Support brand-specific identity, content, settings, and feature configuration.
- Verify that one brand cannot access another brand’s private data.

### Phase 3 — Build core operating modules
- Prioritise CMS/media, events/registration, member/CRM records, communications, and analytics based on user value.
- Add payments, memberships, and automation after requirements, providers, fees, and local operating constraints are validated.

### Phase 4 — Pilot and learn
- Use Urban Hikers as the first production tenant.
- Invite a small number of suitable independent pilot brands.
- Measure setup time, task completion, reliability, support burden, retention, and willingness to pay.

### Phase 5 — Commercialise and scale
- Define plan limits and pricing from validated costs and customer evidence.
- Improve self-service onboarding, documentation, support, integrations, and upgrade paths.
- Scale acquisition only when reliability, onboarding, and retention are healthy.

## 7. Reference products to learn from
Webflow/Wix (brand and site building); WordPress (publishing and extensibility); Circle/Mighty Networks (community); Luma (events); HubSpot (customer relationships); Airtable/Zapier (data and workflows); payment providers suitable for target markets. These are references, not decisions to buy or copy.

## 8. Decisions still open
- Initial customer segment and first external pilot brands.
- Which capabilities to build natively versus integrate.
- Tenant architecture and hosting/data strategy after the audit.
- Payment provider(s), currency handling, settlement, fees, and local compliance.
- Pricing, plan limits, support model, and commercial launch criteria.
- Brand URL strategy: subdomains, custom domains, or both.

## 9. Working rules
- One major step at a time; do not build ahead of unresolved foundations.
- Maintain this document as the roadmap and decision log.
- Distinguish confirmed facts, assumptions, decisions, and open questions.
- Before risky changes: inspect, establish backup/rollback, implement narrowly, test, then deploy.
- A deployment marked ready is not equivalent to a complete end-to-end test.

## 10. Immediate next step
**STEP 1: Platform Architecture and Gap Audit.**

Deliverable: current-state inventory of the app, source and deployment workflow; feature-status map; security and multi-tenant readiness review; source-control discrepancy list; and prioritised recommendation for the next implementation step. No major rewrite or production deployment is part of this audit.

## Status
This document records the agreed direction and proposed sequence. The capability map and roadmap describe the target state; they do not assert that every capability already exists. Technical findings and implementation decisions will be added as the audit progresses.
