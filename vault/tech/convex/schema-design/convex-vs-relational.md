---
title: Convex vs Relational Databases
description: The minimum mindset shift from SQL — explicit indexes, no JOINs, OCC, TS queries, automatic reactivity
type: tech
tags: [backend, convex, architecture, databases, indexes]
source: https://stack.convex.dev/convex-vs-relational-databases
aliases: ["Convex vs Relational"]
---

# Convex vs Relational — Mindset Shift

> **Quick Summary**: You are the query planner. Unlike SQL, Convex has no JOINs, no planner, no row locks, and queries are TypeScript. Reactivity is automatic.

## What doesn't carry over from SQL

- **No JOINs.** Fetch IDs from one table, then `ctx.db.get(id)` for each — use `getAll` / `asyncMap` from `convex-helpers` for parallel reads. Without care this becomes an N+1 pattern (see below).
- **No query planner.** Every read path needs an explicit `.withIndex(...)` or it scans. `.filter()` runs *after* the indexed read; it does not replace an index.
- **No row-level locks.** Convex uses OCC (optimistic concurrency control) — conflicts retry automatically. Design for idempotency. See [[OCC Conflicts]].
- **No SQL.** Queries are TypeScript — no injection surface, no string DSL.
- **No manual reactivity.** All queries via `ConvexReactClient` are live — no polling or pub/sub wiring.

## What does carry over

- Normalization: junction tables for M:N, FKs on child rows for 1:N.
- Indexes are still critical — unindexed reads are table scans.
- Transactions — Convex mutations are fully transactional.

## N+1 in Convex

The "no JOINs" model makes N+1 easy to write accidentally:

```ts
// ❌ N+1 — one db.get per post
const posts = await ctx.db.query("posts").withIndex("by_author", q => q.eq("authorId", id)).collect()
const withAuthors = await Promise.all(posts.map(p => ctx.db.get(p.authorId)))

// ✅ Use getAll for parallel id-batch lookups
import { getAll } from "convex-helpers/server/relationships"
const authorIds = posts.map(p => p.authorId)
const authors = await getAll(ctx.db, authorIds)
```

`db.get` is cheap (~1 ms, same process), but a loop of 1,000 sequential awaits still burns transaction budget. Parallelize with `Promise.all` / `getAll` / `asyncMap` whenever the IDs are independent. See [[Avoiding N+1]] for the full pattern guide.

## See Also

- [[Schema Patterns]] — table definition and validators
- [[Query Indexing]] — `withIndex` usage
- [[Relationship Design]] — M:N and 1:N modeling
- [[Avoiding N+1]] — bulk-fetch patterns and N+1 prevention
- [[OCC Conflicts]]
