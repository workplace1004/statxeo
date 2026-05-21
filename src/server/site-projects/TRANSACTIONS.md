# Site projects transactions

Domain writes that must stay consistent use a single Mongo transaction where the deployment supports it:

1. Persist domain state (project, job, revision).
2. Append `site_generation_events` row.
3. Insert `outbox_events` row for external side effects.
4. Append `credit_ledger_events` when credits change.

Routes and workers must not call email, CDN, or social APIs directly after commit without an outbox record.
