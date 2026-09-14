---
tags: [backend, convex, queries, indexing]
related-skill: convex
aliases: ["Compound Index Ordering"]
---

# Compound Index Ordering

> **Quick Summary**: A compound index can only answer queries that use its columns **left-to-right**. The usable shape is equality on zero-or-more leading columns, then at most one range on the next column, then nothing on the remaining columns. So `[tenantId, _creationTime]` answers "items in tenant X after time T" but **not** "all items after time T."

## Content

### The rule

An index `[a, b, c]` supports:

| Query shape | Supported? |
|---|---|
| `eq(a, ?)` | ✅ |
| `eq(a, ?).eq(b, ?)` | ✅ |
| `eq(a, ?).eq(b, ?).eq(c, ?)` | ✅ |
| `eq(a, ?).gte(b, ?)` | ✅ (range on `b`) |
| `gte(a, ?)` | ✅ (range on leading col) |
| `eq(b, ?)` alone | ❌ (skipped `a`) |
| `eq(a, ?).gte(b, ?).eq(c, ?)` | ❌ (range before equality) |

Equality before range; no skipping.

### Ordering — lead with the most common equality column

```typescript
// ✅ Answers "by tenant", "by tenant + status", "by tenant + status + time":
.index("by_tenantId_status_createdAt", ["tenantId", "status", "_creationTime"])

// ❌ Wrong order — can't answer "by tenantId only" efficiently:
.index("by_createdAt_tenantId_status", ["_creationTime", "tenantId", "status"])
```

Rule of thumb: lead with the highest-cardinality equality column you always filter by (usually the tenant id).

### Range columns go at the end

```typescript
// ✅ Range on _creationTime (suffix)
.index("by_tenantId_createdAt", ["tenantId", "_creationTime"]);

.withIndex("by_tenantId_createdAt", q =>
  q.eq("tenantId", tenantId).gte("_creationTime", since));
```

### Multiple indexes for multiple patterns

If a table serves different query shapes, add multiple focused indexes:

```typescript
items: defineTable({ ... })
  .index("by_tenantId_status", ["tenantId", "status"])
  .index("by_externalId_tenantId", ["externalId", "tenantId"]),   // idempotent upsert
```

Each index costs disk + a small write overhead; don't add speculative ones.

### Index name matches column order

```typescript
// ✅ Name reflects order
.index("by_tenantId_slug", ["tenantId", "slug"])
```

The name is documentation. A mismatched name is a bug waiting to be read.

## Anti-patterns

> [!warning] ❌ Index on a rarely-used leading column — wastes work. Lead with the column you always filter by.

> [!warning] ❌ Range on a non-trailing column — subsequent equality columns can't be narrowed after a range.

> [!tip] ✅ Leading by `_creationTime` at the tenant level (`[tenantId, _creationTime]`) with `.order("desc")` gives a free descending feed.

## Related Notes

- [[Query Indexing]] — `.withIndex` vs `.filter`
- [[Schema Patterns]] — declaring indexes
- [[Time and Caching]] — time-window queries
