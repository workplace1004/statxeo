# UI Migration Tracker

## Completed Surfaces

- Customer portal shell, tabs, workspace stats, website/projects, orders, documents, and support framing now use shared HeroUI portal primitives.
- Affiliate portal shell, navigation tabs, overview framing, link creation/export commands, and ledger/payout/link tables now use shared HeroUI primitives and shared data-table/modal infrastructure.
- White-label admin applications review queue now uses the shared admin shell, search/filter pattern, and consistent review surface framing.
- White-label admin dashboard now uses the shared shell plus reusable table/search surfaces for pricing overrides, client roster, and demo seed run history.
- Social admin route now uses the shared admin shell and the social connections settings cards are aligned to the same app-surface language.
- White-label clients now use the shared portal hero, stat-card, and data-table surfaces while preserving the existing add-client and checkout workflows.
- White-label pricing now uses the shared portal hero, stat-card, and portal-surface framing while preserving the existing plan activation and add-plan workflows.
- White-label account now uses the shared portal hero, stat-card, and portal-surface framing while preserving the existing Stripe onboarding and account-status actions.
- White-label payouts now use the shared portal hero, stat-card, and data-table surfaces while preserving the existing payout confirmation and state-advance workflow.
- White-label team now uses the shared portal hero, stat-card, and data-table surfaces while preserving the existing invite, role-change, and member-status workflows.

## Shared Primitives Added

- `components/portal/portal-primitives.tsx`
- `components/portal/portal-data-table.tsx`
- `components/portal/portal-modal.tsx`

Implementation note:
The shared data-table surface currently uses a semantic HTML table inside the HeroUI shell rather than HeroUI's table wrapper. Runtime verification in the installed HeroUI/React Aria stack exposed row-header accessibility errors during real page rendering, so the shared table infrastructure was kept unified and accessible by owning the table semantics directly.

## Remaining Legacy Pages

- White-label portal sub-pages still mix older shadcn controls inside otherwise modernized shells:
  - branding
- Customer support ops and customer website workspace still need the shared surface/table system.
- Affiliate help/program/public pages still use an older public-marketing visual language and are intentionally separate from portal chrome.
- Social admin composer/history are shell-standardized but still placeholder feature blocks rather than migrated production tools.
- Developer-facing surfaces remain unconsolidated and are not yet on the shared app-surface system.

## High-Risk Routes

- `/affiliate/portal`
  - Multiple command flows, ledger pagination, protected admin export.
- `/white-labeler/admin`
  - Demo seeding, tenant metrics, mixed privileged actions.
- `/white-labeler/admin/applications`
  - Approval/provisioning and invite operations.
- `/white-labeler/admin/social`
  - Social auth redirects and future composer/history work.
- `/customer`
  - Support thread interaction plus download/document flows.

## Known Visual Inconsistencies

- Some admin and portal forms still use shadcn inputs/selects inside HeroUI shells.
- Tooltip, badge, and button variants are still mixed between shadcn and HeroUI in some dense tables/actions.
- Loading and optimistic states are more consistent now, but only a subset of routes use the new surface-level loading states.
- Motion language is lightly applied today; only selective React Bits accents are standardized.

## Consolidation Still Needed

- Move remaining portal forms to a shared HeroUI form field layer.
- Add a reusable command launcher for quick navigation and action execution across customer, affiliate, white-label admin, and future developer surfaces.
- Extend the shared table system with row selection, bulk actions, and responsive column-collapse behavior.
- Add screenshot regression coverage for customer, affiliate, white-label admin, and social admin.
- Add browser-based accessibility verification for keyboard focus, modal trapping, and tab order on migrated routes.
