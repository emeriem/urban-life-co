# Urban Life Co. corporate website refresh — 5 November 2026

## Purpose

Elevate the existing Urban Life Co. public website into a premium parent-company presence while preserving the current React/Vite application, AppDeploy backend, CMS, registrations, ticketing, payments, media workflows and PWA behaviour.

This is an evolution of the production product, not a replacement site.

## Brand architecture

Urban Life Co. is the parent company. Its public identity is distinct from the identities of its portfolio brands. In particular, Urban Hikers retains its own outdoor-lifestyle identity and visual language; the corporate website must not reuse Urban Hikers' brand palette as the parent-company system.

The corporate website should communicate the company's role: building brands, communities and experiences that help people Live. Connect. Explore.

## Visual system

- Direction: premium editorial, minimal, cinematic, human and confident.
- Base: warm mineral/ivory surfaces with deep forest-ink sections.
- Accent: restrained burnt orange / warm terracotta.
- Typography: Inter for utility and body copy; Fraunces for selective editorial contrast.
- Layout: strong typographic hierarchy, deliberate whitespace, asymmetric grids, full-bleed real photography and restrained borders.
- Motion: subtle transitions only; honour `prefers-reduced-motion`.
- Photography: use the existing approved AppDeploy resource library. No fabricated community imagery, invented testimonials or unsupported proof points.

## Public information architecture

- Home — company positioning, ecosystem, experiences, upcoming events and journal.
- About — story, mission and operating philosophy.
- Our Brands — portfolio and experience verticals.
- Experiences — discover the communities and activities.
- Events — upcoming and past events, detail, registration and ticket flows.
- Journal — stories and field notes.
- Community — signup and community discovery.
- Partnerships — brand, experience and community collaboration pathways.
- Contact — enquiry form and direct contact channels.
- Privacy and Terms — public legal information.
- Private Super Admin — existing CMS and operational tools.

## Homepage sequence

1. Cinematic hero using the current approved image carousel, parent-company positioning and two clear calls to action.
2. Editorial company statement clarifying the parent-company role.
3. Three pillars: Live, Connect and Explore.
4. Four-part ecosystem showcase: Urban Hikers, fitness and wellness, Urban Connect, and Travel & Culture.
5. Upcoming events.
6. Parent-company / distinct-brand explanation.
7. Journal stories and field notes.
8. Clear navigation and contact paths in the footer.

The ecosystem labels distinguish existing communities from broader experience verticals. Do not imply that every vertical is a separately launched or fully operational business.

## Functional boundaries

The visual refresh must not change:
- Admin authentication or allowlist behaviour.
- CMS CRUD operations for events, experiences, stories, announcements, messages, media and site settings.
- Google Photos authorization and media workflows.
- Registration, booking, ticket issuance, payment verification, QR check-in or inventory controls.
- Community consent, unsubscribe and CSV export protections.
- PWA installation, offline fallback, service worker or routing semantics.

## Implementation

The refresh is isolated in `src/urban-life-refresh.css`, imported after the existing stylesheet. The existing `src/index.css` remains intact, preserving the current admin and workflow-specific styles. Only limited homepage copy is refined.

## Acceptance criteria

- Existing public routes continue to resolve and remain shareable.
- Existing Super Admin and CMS workflows remain untouched.
- The homepage, portfolio and partnership pages have a consistent editorial system.
- Four ecosystem cards reflow cleanly at desktop, tablet and mobile widths.
- Navigation, buttons, forms and text remain accessible and usable on small screens.
- Reduced-motion preferences are respected.
- Existing event, ticketing, community and media tests remain in the suite.
- The new mobile corporate journey test is included.
- GitHub is updated before the corresponding AppDeploy production deployment.
