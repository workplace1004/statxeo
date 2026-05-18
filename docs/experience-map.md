# Statxeo Experience Map

## Goal

Map the current Statxeo surface area across four experience families:

- Main Statxeo marketing website
- Customer website workspace
- White-label partner website and portal
- Affiliate website and portal

This document is meant to separate public marketing pages from authenticated product routes so the next design pass can be planned cleanly.

## Current UI Stack

- Base UI system: shadcn/ui with Radix primitives
- Portal shell system: HeroUI v3 components layered into white-label workspace surfaces
- Motion and premium visuals: React Bits Pro and local `components/react-bits/*`
- Current React Bits registry setup: already configured in `components.json`
- Shared auth block: `components/blocks/auth-2.tsx`
- Shared recovery components: `components/sections/portal-forgot-password.tsx` and `components/sections/portal-reset-password.tsx`
- HeroUI status: installed as `@heroui/react` and wired globally through `app/globals.css`

## Experience 1: Main Statxeo Website

### Primary purpose

Public marketing site for the core Statxeo offer.

### Route entry

- `/` main homepage

### Current homepage composition

- Navbar
- Hero
- Site preview
- Features
- How it works
- Checkout funnel
- Lead routing CTA
- SEO readiness
- Footer

### Notes

- This is the umbrella brand site.
- It currently markets the main website product, not the partner programs.
- This should remain the cleanest public acquisition surface.

## Experience 2: Customer Website + Portal

### Public and gated routes

- `/customer/login` customer login
- `/customer` authenticated customer portal home
- `/customer/website` authenticated website build pipeline and preview flow
- `/customer/support-ops` authenticated support operations workspace

### Auth behavior

- Unauthenticated access to `/customer` redirects to `/customer/login?next=/customer`
- Unauthenticated access to `/customer/support-ops` redirects to `/customer/login?next=/customer/support-ops`
- Logged-in users visiting `/customer/login` are redirected to `/customer`

### Product model

- `CustomerLoginSection` uses the shared `Auth2` block with `portal="customer"`
- `/customer` is the portal landing page
- `/customer/website` is the website production workflow:
  - setup
  - generate
  - review
  - launch
- `/customer/support-ops` appears to be the staff or support conversation workspace

### Design implication

- Customer has both a portal shell and a project-production shell.
- This experience should read as operations-first, not marketing-first.

## Experience 3: White-Label Partner Website + Portal + Admin

### Public routes

- `/wl` white-label program landing page
- `/white-labeler/apply` partner application flow
- `/white-labeler/login` partner login
- `/white-labeler/forgot-password` password reset request
- `/white-labeler/reset-password` password reset completion

### Authenticated partner portal routes

- `/white-labeler` portal home
- `/white-labeler/account`
- `/white-labeler/branding`
- `/white-labeler/billing`
- `/white-labeler/clients`
- `/white-labeler/payouts`
- `/white-labeler/pricing`
- `/white-labeler/social`
- `/white-labeler/team`

### Authenticated admin routes

- `/white-labeler/admin`
- `/white-labeler/admin/applications`
- `/white-labeler/admin/social`
- `/white-labeler/admin/social/health`

### Auth behavior

- Unauthenticated access to portal routes redirects to `/white-labeler/login?next=/white-labeler`
- Unauthenticated access to admin redirects to `/white-labeler/login?next=/white-labeler/admin`
- Logged-in users visiting `/white-labeler/login` are redirected to `/white-labeler`
- Admin routes additionally require white-label membership with role `owner` or `admin`

### Product model

- `WhiteLabelerLoginSection` uses the shared `Auth2` block with `portal="white-labeler"`
- White-label has the most complete application structure today
- There are three layers:
  - public partner acquisition
  - authenticated partner operations
  - privileged admin controls

### Design implication

- White-label should likely become the most systematized product area.
- It needs the strongest information architecture because it contains onboarding, account management, client management, pricing, payouts, social settings, and admin workflows.

## Experience 4: Affiliate Website + Portal

### Public routes

- `/affiliate` affiliate program landing page
- `/affiliate/help` affiliate help and playbook page
- `/affiliate/login` affiliate login

### Authenticated routes

- `/affiliate/portal` affiliate portal

### Auth behavior

- Unauthenticated access to `/affiliate/portal` redirects to `/affiliate/login?next=/affiliate/portal`
- Logged-in users visiting `/affiliate/login` are redirected to `/affiliate/portal`

### Product model

- `AffiliateLoginSection` uses the shared `Auth2` block with `portal="affiliate"`
- Public affiliate pages are educational and tutorial-like
- The portal is the authenticated workspace for links, commissions, and payout tracking

### Design implication

- Affiliate should be simpler than white-label.
- It needs a strong public education surface plus a compact authenticated dashboard.

## Login System Map

### Shared pattern

All three login pages use the same shared auth block:

- customer: `Auth2 portal="customer"`
- affiliate: `Auth2 portal="affiliate"`
- white-labeler: `Auth2 portal="white-labeler"`

### Current login routes

- `/customer/login`
- `/affiliate/login`
- `/white-labeler/login`

### Recovery routes

- `/customer/forgot-password`
- `/customer/reset-password`
- `/affiliate/forgot-password`
- `/affiliate/reset-password`
- `/white-labeler/forgot-password`
- `/white-labeler/reset-password`

### Standardized state

- Customer, affiliate, and white-label now share the same recovery flow structure
- All three experiences now expose login plus forgot-password plus reset-password routes
- White-label remains the lead reference for the richer authenticated workspace shell

## Recommended Experience Buckets

For planning and design, treat the product as five distinct buckets:

1. Core Statxeo marketing site
2. Customer portal and website build workspace
3. White-label partner marketing and application site
4. White-label partner portal and admin workspace
5. Affiliate marketing, help, login, and portal

This is cleaner than treating everything as one website.

## Recommended UI System Strategy

### React Bits Pro

Use React Bits Pro for:

- hero sections
- animated visual anchors
- premium section blocks
- selective dashboard accents where motion adds value

This is already configured and ready to expand.

### HeroUI Pro

Use HeroUI Pro, if added, for:

- high-consistency application surfaces
- dashboard cards
- forms
- nav shells
- tables
- drawers
- modals
- menus

Current state:

- `@heroui/react` is installed
- HeroUI styles are imported globally in `app/globals.css`
- White-label shell and overview page are the first portal surfaces using HeroUI components directly

That means HeroUI is now an active implementation dependency for portal-grade surfaces.

## Recommended Next Build Order

1. Split public marketing pages from authenticated workspaces at the sitemap and navigation level.
2. Continue redesigning the white-label portal because it has the broadest route surface and now sets the initial HeroUI language for the product side.
3. Bring customer and affiliate portals into the same application grammar after the white-label shell is stable.
4. Refresh the public program pages for `/wl` and `/affiliate` with React Bits Pro hero and section blocks.
5. Expand HeroUI into admin-heavy tables, drawers, and settings forms once the white-label shell settles.

## Immediate Gaps

- The main brand site, partner sites, and product portals are all present, but they are not yet documented as one explicit architecture
- Customer and affiliate portals still need a broader HeroUI shell pass beyond auth recovery

## Working Decision

Current working path:

- keep shadcn/ui available where it already powers existing product flows
- use HeroUI for portal-grade cards, actions, and shell surfaces as the product UI system grows
- keep React Bits Pro for premium visual sections and motion
- use this route map to define which surfaces are public websites versus authenticated software

After that, we can decide whether to:

- keep a mixed system with HeroUI for apps and React Bits for expressive marketing surfaces
- or push HeroUI deeper into customer and affiliate portal shells next