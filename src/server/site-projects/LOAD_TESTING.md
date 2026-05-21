# Site projects load testing

Run before production cutover:

1. **100 concurrent job enqueues** — only one active lease per project; duplicates must dedupe via idempotency keys.
2. **Idempotency replay** — repeat POST trigger with same key; expect 409 or identical snapshot.
3. **Worker crash** — kill process mid-stage; lease expires; job resumes or dead-letters.
4. **1,000 project reads** — p95 latency within SLO.
5. **Artifact timeout** — large payload paths use object storage keys without blocking workers.
6. **Lease contention** — two workers; only one acquires lease.

Use `k6` or `autocannon` against staging with feature flags enabled.
