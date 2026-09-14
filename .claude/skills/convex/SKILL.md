---
name: convex
description: Convex backend patterns — feature folder layout, modular schema, helpers, RBAC, workflows, performance. Use when writing a query, mutation or action, designing a schema or index, adding an auth check, debugging a slow query or OCC conflict, or running a migration.
---

# Convex Backend Dev Guidelines

## Never ship without checking

These violations appear most often in code review — verify before generating any function:

1. **B-01** — every `query`/`mutation`/`action` declares an `args:` validator (per official Convex rules + ESLint `@convex-dev/require-argument-validators`). `returns:` is optional — skip by default; add only when you want a runtime check on the response shape.
2. **ctx.db API** — `ctx.db.get("tableName", id)` — table name is always the first arg (since v1.31.0); same applies to `.patch` and `.delete`
3. **Folder layout** — file path must be `convex/features/<entity>/<purpose>[.public].ts`; schema in `convex/features/<entity>/schema.ts` exporting a named `<entity>Tables` object — never `convex/<name>.ts` (B-08, B-17)
4. **B-05** — public functions start with `requireAuth(ctx)`, then whatever ownership check the row needs — or explicitly document why the function is intentionally public
5. **No unused indexes** — only define an index that is referenced by at least one `.withIndex(...)` call; dead indexes waste storage and confuse readers
6. **No multi-line JSDoc or comment blocks** — one short line max; describe WHY, not WHAT; well-named identifiers do not need comments
7. **Rule citations stay in PRs and commit messages (X-03), not in code** — inline comments like `// B-02: filter by status` are noise; remove them

Content for this skill lives in the Obsidian vault as atomic, wikilinked notes.

**Start here:** `vault/_index.md` (Backend + Architecture sections)

**Key notes:**

- `vault/architecture/backend/function-syntax.md`
- `vault/architecture/backend/public-vs-internal-functions.md`
- `vault/architecture/backend/api-aggregator-pattern.md`
- `vault/architecture/backend/feature-folder-layout.md`
- `vault/architecture/backend/convex-error-handling.md`
- `vault/tech/convex/auth/auth-overview.md`
- `vault/tech/convex/auth/rbac-helpers.md` — three-tier auth contract, full signatures, error shapes, action-identity pattern
- `vault/tech/workos/management.md` — CLI commands for managing orgs/users/roles/webhooks
- `vault/tech/convex/schema-design/schema-patterns.md`
- `vault/architecture/backend/modular-schema.md`
- `vault/tech/convex/schema-design/compound-index-ordering.md`
- `vault/tech/convex/schema-design/relationship-design.md`
- `vault/tech/convex/schema-design/relationship-structures.md`
- `vault/tech/convex/schema-design/relationship-helpers.md`
- `vault/tech/convex/schema-design/convex-vs-relational.md`
- `vault/tech/convex/helpers/helper-functions.md`
- `vault/tech/convex/helpers/lookup-helpers.md`
- `vault/tech/convex/helpers/list-helpers.md`
- `vault/tech/convex/helpers/upsert-helpers.md`
- `vault/tech/convex/helpers/batch-helpers.md`
- `vault/tech/convex/helpers/validation-helpers.md`
- `vault/tech/convex/helpers/database-triggers.md` — `customMutation` + `Triggers` registry, change payload, counter/cascade use-cases
- `vault/tech/convex/performance/query-indexing.md`
- `vault/tech/convex/performance/time-and-caching.md`
- `vault/tech/convex/performance/hot-path-rules.md`
- `vault/tech/convex/performance/subscription-cost.md`
- `vault/tech/convex/performance/function-budget.md`
- `vault/tech/convex/performance/occ-conflicts.md`
- `vault/tech/convex/performance/collect-and-pagination.md` — .collect/.take/.paginate decision rules, counting paginated results
- `vault/tech/convex/schema-design/avoiding-n-plus-one.md` — Promise.all by id, bulk fetch + Map, deduplication
- `vault/tech/convex/best-practices/zen-of-convex.md`
- `vault/tech/convex/components/component-boundaries.md`
- `vault/tech/convex/http/http-routes.md` — httpAction anatomy, convex/http.ts mount point, webhook signature verification, idempotency, error→HTTP status mapping
- `vault/tech/convex/components/workpool.md` — priority queues, parallelism limits (100 Pro / 20 free), retry, onComplete
- `vault/tech/convex/components/workflow.md` — durable execution, step orchestration, idempotency (B-10), parallelism (B-15), non-determinism restrictions
- `vault/tech/convex/components/action-retrier.md` — single-action retry with exponential backoff
- `vault/tech/convex/components/crons.md` — dynamic runtime cron registration (vs static built-in crons)
- `vault/tech/convex/migrations/migration-patterns.md`
- `vault/tech/convex/migrations/migration-workflow.md`
- `vault/tech/convex/migrations/migrations-component.md`
- `vault/architecture/backend/testing/backend-testing-fixtures.md`
- `vault/architecture/backend/testing/internal-function-testing.md`
- `vault/architecture/backend/testing/access-control-patterns.md` — mandatory three-test matrix per protected function
- `vault/architecture/backend/testing/workos-auth-mocking.md` — vi.mock getAuth(), scenario table, reusable factories
- `vault/tech/Backend Anti-Patterns Index.md` — points to per-area anti-pattern files: `vault/tech/convex/Convex Anti-Patterns.md`, `vault/tech/resend/Resend Anti-Patterns.md`
- `vault/tech/resend/overview.md` — project email architecture, scheduler decision, template locations
- `vault/tech/resend/sdk-patterns.md` — SDK gotchas for Convex action email sends (no-throw, idempotency, error dispatch)
- `vault/architecture/backend/resend-component.md` — `@convex-dev/resend` component: workpool-backed delivery, testMode gotcha, webhook handler

**Rules:** `vault/_conventions.md` (B-01 … B-18, X-01, X-02) — note B-17 (feature folder layout) and B-18 (API aggregator) added 2026-04-29

Navigate from `_index.md` — do not read the whole vault.
