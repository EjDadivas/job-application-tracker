---
tags: [convex, anti-patterns, index]
related-skill: convex
---

# Convex Anti-Patterns

## Query performance

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `.filter()` on a raw query | Full table scan | [[Query Indexing]] `.withIndex` |
| `.collect()` without an index | Unbounded reads | [[Collect Bounds and Pagination]] |
| `(await q.collect())[0]` | Loads all rows to return one | `.first()` or `.take(1)` |
| Post-collect JS `.sort()` | Index already has order | [[Query Indexing]] `.order("asc"\|"desc")` |
| Range on a non-trailing index column | Index can't be used | [[Compound Index Ordering]] |
| Sequential `await` in a loop for joins | N round-trips of latency | [[Avoiding N+1]] `Promise.all` |
| Forgetting to dedupe foreign IDs before fetch | N calls when K distinct | [[Avoiding N+1]] |
| `Date.now()` inside a query | Breaks cache + reactivity | [[Time and Caching]] |
| Global `COUNT(*)` query | Invalidates on every insert/delete | `@convex-dev/aggregate` |
| Patching counters on a single hot document | OCC conflicts under load | [[occ-conflicts]] — shard instead |

## Schema

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `createdAt` alongside `_creationTime` | Fields drift; one goes stale | [[Schema Patterns]] — drop custom field |
| Stringly-typed enum `status: v.string()` | No compile-time safety | [[Schema Patterns]] `v.union(v.literal(...))` |
| No index on a foreign-key column | Expensive scans, N+1 joins | [[Query Indexing]] |
| One giant root `schema.ts` | Constant merge conflicts | [[Modular Schema]] |
| Feature exports `defineSchema({...})` instead of `<feature>Tables` | Can't spread into root | [[Modular Schema]] |
| `v.array(v.id(...))` for reverse-queried relationships | Full scan to find referrers | [[Relationship Design]] — junction table |

## Function structure

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Missing `args` or `returns` validator | Implicit contract | [[Function Syntax]] |
| `v.any()` as a shortcut | Defeats validator | [[Function Syntax]] |
| Unawaited `ctx.scheduler.runAfter` / `ctx.db.patch` | Silent loss | [[Function Syntax]] — always `await` |
| DB write inside an action | Actions have no `ctx.db` | [[Public vs Internal Functions]] |
| Raw `mutation` from `_generated/server` (not `convex/index.ts`) | Triggers don't fire | [[Database Triggers]] |
| `index.ts` at the feature level | Obscures public/internal split | [[Feature Folder Layout]] |
| Logic inside aggregator files | Pollutes re-export surface | [[API Aggregator Pattern]] |

## Auth & authorization

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Auth check inside an internal function | Fails from workflow/scheduler; untestable | [[Public vs Internal Functions]] |
| Scheduling `api.*` | Scheduler has no identity; auth throws | [[Public vs Internal Functions]] |
| `ctx.auth.getUserIdentity()` directly in feature code | Duplicates user lookup, loses typed error | [[RBAC Helpers]] |
| Workspace check before resource fetch | Need resource's `workspaceId` first | [[RBAC Helpers]] |
| Trusting client-supplied `userId` in args | Can be spoofed | [[auth-overview]] — verify server-side |

## Helpers

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Upsert keyed by `_id` | `_id` is auto-generated; never known ahead of time | [[Upsert Helpers]] — natural key |
| `.first()` on a unique-keyed index | Hides duplicate-key bugs | [[Upsert Helpers]] — `.unique()` |
| `getItem` silently returns `null` | Ambiguous contract | [[Lookup Helpers]] — name it `findItem` or throw |
| `throw "not found"` (string throw) | Loses structured info | [[Validation Helpers]] `ConvexError({ code, message, ... })` |
| Validator that also writes | Mixes assert-and-fix concerns | [[Validation Helpers]] |
| Pure code in `helpers.ts` | Confuses helpers vs utils | [[File Structure Conventions]] — use `utils.ts` |
| `ctx.runAction` for same-runtime logic | Unnecessary overhead | [[Helper Functions]] — just call the TS function |
| Sequential `ctx.runQuery` calls from an action | Results can diverge between transactions | [[Helper Functions]] — combine into one internal function |

## Durable functions & workflows

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Long-running plain `action` | No durability on failure | [[Workflow]] |
| Workflow step calls `api.*` | Auth check with no identity; throws | [[Public vs Internal Functions]] |
| Non-idempotent step | Duplicates on retry | [[Workflow]] — upsert by natural key |
| `Promise.all` of `ctx.runMutation` instead of `step.runParallel` | No durability on parallel branches | [[Workflow]] |
| Direct `fetch` inside a workflow | Blocked; I/O not allowed in steps | [[Workflow]] — use `ctx.runAction` |
| Single-step workflow | Extra infrastructure for no gain | [[Workflow]] — plain action instead |

## Triggers

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Raw `mutation` bypasses triggers | Side effects silently skipped | [[Database Triggers]] |
| Trigger that calls an external API | Transaction waits on I/O | [[Database Triggers]] — schedule an action |
| Trigger with no guard on `change.operation` | Delete-cascade runs on every insert/update | [[Database Triggers]] |
| Counter update in a separate mutation from the row write | Race window; drift | [[Database Triggers]] |

## Components

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Component code uses `ctx.auth.getUserIdentity()` | No auth context inside components | [[component-boundaries]] — app resolves and passes |
| `v.id("users")` inside a component | Table IDs are app-scoped | [[component-boundaries]] — use `v.string()` |
| Importing from app's `_generated/server.js` inside component | Cross-boundary import breaks isolation | [[component-boundaries]] — use component's own generated files |
| Direct client access to component functions | Bypasses app's re-export surface | [[component-boundaries]] — re-export through app mutation |

## Migrations

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Making a field required before migrating data | Deploy rejected | [[Migration Workflow]] — migrate first, then tighten schema |
| `.collect()` on large tables in migration | Hits transaction limits | [[Migration Workflow]] — use migrations component |
| Crons for migration batches | Manual cleanup; component handles batching | [[Migration Workflow]] |

## Testing

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Only a happy-path test | Ships silent auth bugs | [[Access Control Patterns]] — three-test matrix |
| Matching error messages by string | Breaks on rewording | [[Access Control Patterns]] — match on `data.code` |
| Mocking `ctx.db` | Defeats convex-test | [[Backend Testing Fixtures]] — real in-memory DB |
| Shared fixture state across tests | Cross-test contamination | [[Backend Testing Fixtures]] — fresh fixture per test |
| Testing internals only through public wrapper | Loses edge-case coverage | [[Internal Function Testing]] |
