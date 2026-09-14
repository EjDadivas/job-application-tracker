---
tags: [backend, helpers, convex, patterns]
related-skill: convex
aliases: ["List Helpers"]
---

# List Helpers

> **Quick Summary**: A list helper has the shape `listXByY(ctx, y) → Doc<"x">[]`. It wraps a `.withIndex(...)` query so the index choice lives in one place. Always use `.withIndex` — not `.filter` on raw queries — and always bound the result with `.take(n)`, `.collect()` against a narrow index, or `.paginate(...)` for user-facing lists.

## Content

### Canonical pattern

```typescript
import type { QueryCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";

export async function listItemsByTenant(
  ctx: QueryCtx,
  tenantId: Id<"tenants">,
): Promise<Doc<"items">[]> {
  return await ctx.db
    .query("items")
    .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
    .collect();
}
```

One index name, one helper — if the query pattern changes, one file changes.

### Bounded collect

`.collect()` loads every matching row. Only safe against a narrow index.

```typescript
// ✅ Narrow by tenantId — bounded by tenant size
await ctx.db.query("items")
  .withIndex("by_tenantId", q => q.eq("tenantId", tenantId))
  .collect();

// ❌ Table scan — unbounded
await ctx.db.query("items").collect();
```

### Filtered lists — do it in index, not `.filter`

```typescript
// ❌ Scans then filters
const active = (await listItemsByTenant(ctx, tenantId))
  .filter((i) => i.archivedAt === undefined);

// ✅ Index does the filtering
export async function listActiveItemsByTenant(ctx: QueryCtx, tenantId: Id<"tenants">) {
  return await ctx.db
    .query("items")
    .withIndex("by_tenantId_archivedAt", (q) =>
      q.eq("tenantId", tenantId).eq("archivedAt", undefined),
    )
    .collect();
}
```

### Ordering

```typescript
await ctx.db.query("items")
  .withIndex("by_tenantId_createdAt", q => q.eq("tenantId", tenantId))
  .order("desc")
  .take(20);
```

`.order("desc")` against an index is free. Sorting in JS after `.collect()` is a red flag — re-index.

### Paginated list

```typescript
import type { PaginationOptions, PaginationResult } from "convex/server";

export async function listItemsPaginated(
  ctx: QueryCtx,
  tenantId: Id<"tenants">,
  opts: PaginationOptions,
): Promise<PaginationResult<Doc<"items">>> {
  return await ctx.db
    .query("items")
    .withIndex("by_tenantId_createdAt", (q) => q.eq("tenantId", tenantId))
    .order("desc")
    .paginate(opts);
}
```

## Anti-patterns

> [!warning] ❌ `.filter()` on a raw `ctx.db.query(...)` without `.withIndex` — scans the whole table.

> [!warning] ❌ Collecting everything then slicing — `(await q.collect()).slice(0, 10)` loads N to return 10. Use `.take(10)` or `.paginate(...)`.

> [!warning] ❌ Post-collect `.sort(...)` in JS — put the sort column into the index and use `.order`.

> [!tip] ✅ List helper returns a typed array — `Promise<Doc<"items">[]>` gives consumers autocomplete.

## Related Notes

- [[Helper Functions]] — helper taxonomy
- [[Query Indexing]] — `.withIndex` rule
- [[Compound Index Ordering]] — equality-before-range
