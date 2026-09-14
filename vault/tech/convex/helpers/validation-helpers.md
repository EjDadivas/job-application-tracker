---
tags: [backend, helpers, convex, validation]
related-skill: convex
aliases: ["Validation Helpers"]
---

# Validation Helpers

> **Quick Summary**: Validation helpers assert invariants that can't be expressed in the schema — uniqueness within a tenant, quota limits, forbidden transitions. Shape: `assertXYZ(ctx, ...) → void`, throwing `ConvexError` on failure. They run inside the same mutation as the write they protect, so the transaction rolls back cleanly.

## Content

### Canonical pattern

```typescript
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function assertUniqueItemSlug(
  ctx: QueryCtx,
  tenantId: Id<"tenants">,
  slug: string,
): Promise<void> {
  const existing = await ctx.db
    .query("items")
    .withIndex("by_slug_tenantId", (q) =>
      q.eq("slug", slug).eq("tenantId", tenantId),
    )
    .unique();

  if (existing) {
    throw new ConvexError({
      code: 'CONFLICT',
      message: 'Slug already taken',
      data: { reason: 'slug_taken', resource: 'item', slug },
    });
  }
}
```

### When a validator belongs here vs in the schema

| Constraint | Home |
|---|---|
| Type / required / optional | schema validator |
| Enumerated value | `v.union(v.literal(...))` in schema |
| Uniqueness across the whole table | unique index |
| Uniqueness scoped to a tenant | validation helper |
| Transition rule | validation helper |
| Quota | validation helper |

Schema constraints fire at the storage layer; validation helpers fire at the handler layer where you have context.

### Compose with the write

```typescript
export const createItem = mutation({
  args: { tenantId: v.id("tenants"), name: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    await assertUniqueItemSlug(ctx, args.tenantId, args.slug);
    return await ctx.db.insert("items", { ...args });
  },
});
```

Because everything runs in one transaction, a later failure rolls back the insert cleanly.

### Transition validators

```typescript
export async function assertValidStatusTransition(
  current: "open" | "resolved" | "archived",
  next: "open" | "resolved" | "archived",
): Promise<void> {
  const legal: Record<string, string[]> = {
    open: ["resolved", "archived"],
    resolved: ["open", "archived"],
    archived: [],
  };
  if (!legal[current].includes(next)) {
    throw new ConvexError({ code: 'INVALID_TRANSITION', message: 'Invalid status transition', data: { from: current, to: next } });
  }
}
```

Pure function, so it lives in `utils.ts` — no `ctx`.

### Quota validators

```typescript
export async function assertItemQuota(
  ctx: QueryCtx,
  tenantId: Id<"tenants">,
): Promise<void> {
  const items = await ctx.db
    .query("items")
    .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
    .collect();
  if (items.length >= 100) {
    throw new ConvexError({ code: 'QUOTA_EXCEEDED', message: 'Item quota exceeded', data: { resource: 'item', max: 100 } });
  }
}
```

## Anti-patterns

> [!warning] ❌ Validation in the frontend only — the frontend may be bypassed. Every invariant needs a server-side check.

> [!warning] ❌ Generic `Error` instead of `ConvexError` — generic errors don't round-trip typed data.

> [!warning] ❌ Validator that also writes — assertions throw; writes write.

> [!tip] ✅ Typed error payloads via `code` discriminator — lets the frontend branch cleanly.

## Related Notes

- [[Helper Functions]] — helper taxonomy
- [[Schema Patterns]] — what belongs at the storage layer
- [[ConvexError Handling]] — typed error shapes
- [[Upsert Helpers]] — uniqueness enforced through `unique()`
