---
title: Avoiding N+1
description: Three patterns for resolving foreign keys without one query per row — Promise.all by id, indexed bulk fetch + Map, deduplicated id batching
type: tech
tags: [backend, convex, queries, performance]
aliases: ["Avoiding N+1"]
---

# Avoiding N+1

An N+1 pattern is one query for a list of N rows, then one extra query per row to resolve a foreign key. Convex has no SQL joins — you resolve foreign keys in application code. Do it right or you hit read-budget limits and inflate reactive invalidation. See **B-14**.

## The problem

```typescript
// ❌ N+1: one query for items, then one per author
const items = await ctx.db.query("items")
  .withIndex("by_ownerId", q => q.eq("ownerId", ownerId))
  .collect();

const withAuthors = await Promise.all(items.map(async (item) => ({
  ...item,
  author: item.authorId ? await ctx.db.get(item.authorId) : null,
})));
```

If there are 200 items that's 201 DB calls. Convex parallelizes via `Promise.all` so wall time is tolerable, but you eat read budget and every subscribed document inflates reactive re-runs.

## Pattern 1: `Promise.all` by id (small fan-out)

For a short list of foreign-key IDs, `ctx.db.get(id)` in parallel is fine:

```typescript
const [record, parent, owner] = await Promise.all([
  ctx.db.get(recordId),
  ctx.db.get(record.parentId),
  ctx.db.get(record.ownerId),
]);
```

Three calls, one round trip's worth of latency. Good up to ~10 lookups.

## Pattern 2: Indexed bulk fetch + map (large fan-out)

Fetch the related set once with a single indexed query:

```typescript
const items = await ctx.db.query("items")
  .withIndex("by_groupId", q => q.eq("groupId", groupId))
  .collect();

// One query for all users in this scope
const users = await ctx.db.query("users")
  .withIndex("by_tenantId", q => q.eq("tenantId", tenantId))
  .collect();

const byId = new Map(users.map(u => [u._id, u]));

const enriched = items.map(item => ({
  ...item,
  author: item.authorId ? byId.get(item.authorId) ?? null : null,
}));
```

Two queries total, regardless of N.

## Pattern 3: `Promise.all` over deduplicated IDs

When the related set isn't cleanly bounded by a single index:

```typescript
const authorIds = Array.from(new Set(items.map(i => i.authorId).filter(Boolean)));
const authors = await Promise.all(authorIds.map(id => ctx.db.get(id!)));
const byId = new Map(authors.filter(Boolean).map(u => [u!._id, u!]));

const enriched = items.map(item => ({
  ...item,
  author: item.authorId ? byId.get(item.authorId) ?? null : null,
}));
```

Key: **deduplicate first**. If 50 items share 5 authors, you fetch 5 users, not 50.

## Two-hop joins

```typescript
// items → authors → tenants (2 hops)
const items = await list(...);
const userIds = dedupe(items.map(i => i.authorId));
const users = await Promise.all(userIds.map(id => ctx.db.get(id!)));
const tenantIds = dedupe(users.map(u => u?.tenantId));
const tenants = await Promise.all(tenantIds.map(id => ctx.db.get(id!)));
// compose
```

Three total batches, not N×3 queries.

## The real costs

Convex's query batching handles `Promise.all` over `ctx.db.get` efficiently. The actual cost comes from:
- **Read budget** — each call counts against per-function limits.
- **Reactive invalidation** — queries subscribing to many documents re-run more often.

Both scale with N. For large lists, always use Pattern 2.

## Anti-patterns

> [!warning] ❌ Sequential `await` in a loop
> ```typescript
> for (const item of items) {
>   const author = await ctx.db.get(item.authorId); // serial!
> }
> ```
> Use `Promise.all` or bulk-fetch.

> [!warning] ❌ A helper that hides N queries per row
> `listItemsWithAuthors` doing N internal lookups — the helper hides the cost. Make queries visible at the call site, or batch.

> [!warning] ❌ Forgetting to deduplicate
> `Promise.all` over raw ids fetches twice when two items share an author. `new Set(ids)` first.

> [!tip] ✅ Build a `Map` keyed by `_id` for the enrichment pass
> `new Map(parents.map(p => [p._id, p]))` → O(1) lookups. No repeated `.find()` calls.

## See also

- [[query-indexing]] — required for the bulk-fetch pattern
- [[list-helpers]] — where enrichment logic typically lives
- [[collect-and-pagination]] — pagination with enrichment
- [[time-and-caching]] — reactivity implications of many subscriptions
- [[relationship-helpers]] — `getManyFrom`, `getManyVia`, `getAll` from convex-helpers for common traversal patterns ([source](https://stack.convex.dev/functional-relationships-helpers))
- [[convex-vs-relational]] — how "no JOINs" sets up the N+1 risk
