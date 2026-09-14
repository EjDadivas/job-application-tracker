---
tags: [backend, helpers, convex, patterns]
related-skill: convex
aliases: ["Upsert Helpers"]
---

# Upsert Helpers

> **Quick Summary**: An upsert helper looks up by a natural key, inserts if missing, patches if present. Right shape for sync flows (mirroring third-party records into your DB) because the caller doesn't need to know whether the row exists. Key detail: use a **unique index** for the lookup so `.unique()` enforces the invariant.

## Content

### Canonical pattern

```typescript
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function upsertItem(
  ctx: MutationCtx,
  input: {
    tenantId: Id<"tenants">;
    externalId: string;
    name: string;
  },
): Promise<Id<"items">> {
  const existing = await ctx.db
    .query("items")
    .withIndex("by_tenantId_externalId", (q) =>
      q.eq("tenantId", input.tenantId).eq("externalId", input.externalId),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { name: input.name });
    return existing._id;
  }

  return await ctx.db.insert("items", input);
}
```

`.unique()` throws if the index matches more than one row — exactly what you want for a natural-key lookup.

### The index must be unique-enough

If two rows could have the same `(tenantId, externalId)`, `.unique()` will throw and you'll lose writes. If the key isn't guaranteed unique, that's usually a schema smell — fix the schema.

### Insert path returns the new id

```typescript
const itemId = await upsertItem(ctx, { ... });
// either existing row's id or newly-created one.
```

Callers shouldn't have to branch on "did you insert or update." The helper hides that.

### Use with scheduled sync

Upserts are idempotent when keyed correctly — a re-run of the same input produces the same DB state. Pair well with scheduled jobs:

```typescript
await ctx.scheduler.runAfter(0, internal.features.<entity>.runSync, { tenantId });
// inside runSync → for each external record → upsertItem(ctx, input)
// safe to re-run on retry.
```

## Anti-patterns

> [!warning] ❌ Upsert keyed by `_id` — `_id` is auto-generated. Upsert by a natural key (`externalId`, `slug`, composite).

> [!warning] ❌ `first()` instead of `unique()` on a unique key — silently hides duplicate-key bugs.

> [!warning] ❌ Separate `createOrUpdate` and `create` helpers that diverge — one helper, one shape.

> [!tip] ✅ Return the id unconditionally — `Promise<Id<"items">>` whether inserted or updated.

## Related Notes

- [[Helper Functions]] — helper taxonomy
- [[Batch Helpers]] — upsert lists of inputs
- [[Schema Patterns]] — declaring unique indexes
- [[Query Indexing]] — `.withIndex` on the lookup
