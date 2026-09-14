---
tags: [backend, convex, queries, caching]
related-skill: convex
aliases: ["Time and Caching"]
---

# Time and Caching

> **Quick Summary**: Queries in Convex are cached and reactive — the same arguments return the same cached result until something the query read changes. Never call `Date.now()` inside a query: it makes the result uncacheable and breaks reactivity. For time-based reads, pass the timestamp in as an argument or do the work in a mutation.

## Content

### Queries are deterministic + cached

A query with args `(A, B)` runs once and caches the result. Any write to a document the query read invalidates the cache; subscribers re-run.

### `Date.now()` breaks caching

```typescript
// ❌ Every call returns a different value → cache worthless
export const listRecentItems = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const since = Date.now() - 24 * 60 * 60 * 1000;  // ❌
    return await ctx.db.query("items")
      .withIndex("by_tenantId_createdAt", q =>
        q.eq("tenantId", args.tenantId).gte("_creationTime", since))
      .collect();
  },
});
```

`Date.now()` (and `Math.random()`) is a determinism leak.

### Fix 1: pass time as an arg

```typescript
// ✅
export const listRecentItems = query({
  args: { tenantId: v.id("tenants"), since: v.number() },
  handler: async (ctx, args) =>
    ctx.db.query("items")
      .withIndex("by_tenantId_createdAt", q =>
        q.eq("tenantId", args.tenantId).gte("_creationTime", args.since))
      .collect(),
});

// Frontend
const since = Date.now() - 24 * 60 * 60 * 1000;
const data = useQuery(api.functions.<entity>.listRecentItems, { tenantId, since });
```

The cache keys per `(tenantId, since)` tuple.

### Fix 2: round time to a stable bucket

```typescript
const hour = Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000);
const since = hour - 24 * 60 * 60 * 1000;
```

All frontends in the same hour share the cache.

### Fix 3: do time-sensitive work in a mutation or action

Mutations and actions aren't cached. Use `Date.now()` freely inside them:

```typescript
export const archiveItem = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { archivedAt: Date.now() });
  },
});
```

### Reactive invalidation radius

Every doc a query reads becomes a subscription. A query that reads 500 items re-runs when any of those 500 change. For hot tables, narrow what you read:

- Paginate instead of `.collect`.
- Return only the shape the frontend uses.
- Split one mega-query into two that subscribe to different radii.

### Using `_creationTime` for time-window queries

```typescript
.index("by_tenantId_createdAt", ["tenantId", "_creationTime"])

.withIndex("by_tenantId_createdAt", q =>
  q.eq("tenantId", tenantId).gte("_creationTime", since))
```

`_creationTime` is auto-populated — don't duplicate with your own `createdAt`.

## Anti-patterns

> [!warning] ❌ `Date.now()` / `Math.random()` in a query — kills determinism and reactivity.

> [!warning] ❌ Adding your own `createdAt` to a table — duplicates `_creationTime`.

> [!warning] ❌ A single query that reads half the table — every write invalidates all subscribers.

> [!tip] ✅ Think of cache key as `(function, args, reads)`. Stable args = better hit rate.

## Related Notes

- [[Query Indexing]] — `.withIndex` + range predicates
- [[Compound Index Ordering]] — time as a trailing range column
- [[Function Syntax]] — `args` shape
