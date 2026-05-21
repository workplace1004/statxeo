# Statxeo -> Mobile Implementation Plan

## Phase 1: Foundation (completed in this iteration)
1. Initialize Expo + TypeScript app in `mobile`.
2. Configure environment strategy using `EXPO_PUBLIC_*` variables.
3. Add Supabase client with persisted React Native session storage.
4. Add authenticated API client for existing Next.js `/api/*` routes.
5. Implement auth flow:
   - Sign-in screen
   - Session restore on app launch
   - Sign-out flow
6. Implement base navigation:
   - Auth stack
   - App tab shell (`Home`, `Clients`, `Profile`)
7. Port first white-labeler data flows:
   - `GET /api/white-labeler/overview`
   - `GET /api/white-labeler/clients`

## Phase 2: Full white-labeler parity
1. Branding domain management.
2. Pricing and plan overrides.
3. Billing history + payouts.
4. Team management.
5. Application workflow and admin decisions.
6. Stripe account-link/dashboard-link actions.

## Phase 3: Affiliate parity
1. Affiliate overview metrics.
2. Affiliate links CRUD.
3. Ledger pagination + filters.
4. Payout history.
5. Admin payout export flow.

## Phase 4: Customer parity
1. Customer auth + overview.
2. Website project setup and tracking.
3. Support threads/messages.
4. Documents and orders.
5. Workflow orchestration endpoints.

## Phase 5: AI + project operations
1. AI generate/approve/status flows.
2. Site projects trigger/reconcile flow.
3. Media upload signing + project media management.
4. Operational controls and error-state handling.

## Phase 6: Production hardening
1. Shared design system for mobile.
2. Form validations and offline-safe retries.
3. Crash reporting/logging.
4. Integration tests for auth + critical business APIs.
5. Release channels and build pipelines for Android/iOS.
