# Site projects disaster recovery

## Mongo

- Enable regular backups and PITR per Atlas/hosting policy.
- After restore, run `POST /api/admin/ensure-indexes`.

## Rebuild job snapshot

Replay `site_generation_events` ordered by `createdAt` to reconstruct `stage` and terminal `status` on `site_generation_jobs`.

## Credit ledger

Sum `CREDIT_*` events per `orgId` and compare to billing expectations.

## Outbox

Replay `pending` / `failed` outbox rows with the same `idempotencyKey` — delivery handlers must be at-least-once safe.

## Published content

Restore `site_revisions` and project publish pointers (`publishedRevisionId`, `previousPublishedRevisionId`) together.
