---
tags: [backend, helpers, convex, patterns]
related-skill: convex
aliases: ["Batch Helpers"]
---

# Batch Helpers

> **Quick Summary**: A batch helper applies a per-row helper to an array, typically from a sync action. Shape: `batchUpsertX(ctx, inputs)`. Live behind `internalMutation` because they fan-out writes; never call from public handlers directly (too easy to blow past Convex's per-mutation write limit).

## Content

### Canonical pattern

```typescript
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function batchUpsertItems(
  ctx: MutationCtx,
  input: {
    tenantId: Id<"tenants">;
    items: { externalId: string; name: string }[];
  },
): Promise<number> {
  for (const item of input.items) {
    await upsertItem(ctx, { tenantId: input.tenantId, ...item });
  }
  return input.items.length;
}
```

Each iteration calls the per-row helper — keep the atomic operation factored.

### Exposed as an internal mutation

```typescript
// mutations.ts (internal)
export const batchUpsertItemsMutation = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    items: v.array(v.object({ externalId: v.string(), name: v.string() })),
  },
  handler: async (ctx, args) => batchUpsertItems(ctx, args),
});
```

Called from an action:
```typescript
await ctx.runMutation(
  internal.features.<entity>.mutations.batchUpsertItemsMutation,
  { tenantId, items },
);
```

### Respect the write ceiling

Convex limits the number of writes per mutation. Batch helpers over large arrays must chunk:

```typescript
const CHUNK_SIZE = 500;
for (let i = 0; i < items.length; i += CHUNK_SIZE) {
  const chunk = items.slice(i, i + CHUNK_SIZE);
  await ctx.scheduler.runAfter(0, internal.features.<entity>.mutations.batchUpsertItemsMutation, {
    tenantId,
    items: chunk,
  });
}
```

### Return a summary, not the rows

```typescript
// ✅ Small payload
return input.items.length;

// ❌ Returning all upserted docs forces a full serialization
```

If the caller needs ids, return `Id[]`, not `Doc[]`.

## Anti-patterns

> [!warning] ❌ Batch helper called from a public mutation — large batches time out. Schedule an internal mutation instead.

> [!warning] ❌ Parallel `Promise.all` over a batch — Convex serializes mutations per-document anyway.

> [!warning] ❌ Nesting queries inside each iteration — fetch the lookup set once, then iterate.

> [!tip] ✅ Chunk large inputs and schedule — 500–1000 per chunk is a safe default.

## Related Notes

- [[Helper Functions]] — helper taxonomy
- [[Upsert Helpers]] — the per-row helper
