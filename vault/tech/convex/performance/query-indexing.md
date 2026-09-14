---
tags: [backend, convex, queries, indexing, performance]
related-skill: convex
aliases: ["Query Indexing"]
---

# Query Indexing

> **Quick Summary**: Convex queries come in two shapes: `.withIndex(...)` (server-side, uses the index) and `.filter(...)` (client-side, scans). Rule: every read path in production must use `.withIndex`. `.filter` is a smell unless narrowing within an already-indexed subset.

## Content

### The two shapes

```typescript
// ✅ Indexed read
await ctx.db.query("items")
  .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
  .collect();

// ❌ Table scan + post-filter
await ctx.db.query("items")
  .filter((q) => q.eq(q.field("tenantId"), tenantId))
  .collect();
```

`.filter` loads every row and checks the predicate in app code; `.withIndex` narrows at the storage layer.

### When `.filter` is acceptable

Only when you've already narrowed via `.withIndex` and need a post-filter that can't be expressed in the index key:

```typescript
await ctx.db.query("items")
  .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
  .filter((q) => q.neq(q.field("labels"), []))
  .collect();
```

Even then, prefer promoting the filter into a compound index if hot — see [[Compound Index Ordering]].

### Index predicates

Within `.withIndex`, predicates support `eq`, `lt`, `lte`, `gt`, `gte`, `between` — in left-to-right prefix order on the compound index key.

```typescript
// Given index "by_tenantId_createdAt" on ["tenantId", "_creationTime"]:

// ✅ Equality on prefix, range on suffix
.withIndex("by_tenantId_createdAt", q =>
  q.eq("tenantId", tenantId).gte("_creationTime", since))

// ❌ Skipping the prefix
.withIndex("by_tenantId_createdAt", q =>
  q.gte("_creationTime", since))  // doesn't type-check
```

### Reading by id — `ctx.db.get`

```typescript
// ✅ O(1), no index needed
await ctx.db.get(itemId);
```

`ctx.db.get` is free (indexed on `_id`).

### Add an index whenever you query by a field

If tempted to `.filter` in production code, add the index in the feature's `schema.ts`:

```typescript
// schema.ts
items: defineTable({ ... })
  .index("by_tenantId", ["tenantId"])
  .index("by_slug_tenantId", ["slug", "tenantId"]),
```

### Order matters

`.order("asc" | "desc")` on an indexed query uses the index's native order — no sort cost. After `.collect()`, any `.sort(...)` in JS is a red flag.

## Anti-patterns

> [!warning] ❌ `.filter` on a raw query — full-table scan every time.

> [!warning] ❌ Sorting after `.collect` — put the sort column in the index and use `.order`.

> [!warning] ❌ Duplicate indexes — e.g. `[tenantId]` and `[tenantId, archivedAt]` — the second covers the first for equality. Drop the narrower one.

> [!tip] ✅ When in doubt, index. Disk is cheap; read-path latency isn't.

## Related Notes

- [[Compound Index Ordering]] — equality-then-range rule
- [[Time and Caching]] — `_creationTime` range queries, query cache
- [[Schema Patterns]] — declaring indexes
