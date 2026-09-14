---
tags: [backend, helpers, convex, patterns]
related-skill: convex
aliases: ["Lookup Helpers"]
---

# Lookup Helpers

> **Quick Summary**: A lookup helper has the shape `getXByIdOrThrow(ctx, id) → Doc<"x">`. It centralizes the "fetch and throw if missing" pattern so handlers don't repeat `if (!x) throw ...` five times. Variants: `getXByY` (returns `Doc | null`), `getXByYOrThrow` (throws).

## Content

### Canonical pattern

```typescript
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";

export async function getItemByIdOrThrow(
  ctx: QueryCtx,
  itemId: Id<"items">,
): Promise<Doc<"items">> {
  const item = await ctx.db.get(itemId);
  if (!item) {
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'item not found',
      data: { resource: 'item', id: itemId },
    });
  }
  return item;
}
```

### "Or null" variant

When the handler has a meaningful `null` branch:

```typescript
export async function findItemBySlug(
  ctx: QueryCtx,
  tenantId: Id<"tenants">,
  slug: string,
): Promise<Doc<"items"> | null> {
  return await ctx.db
    .query("items")
    .withIndex("by_slug_tenantId", (q) =>
      q.eq("slug", slug).eq("tenantId", tenantId),
    )
    .unique();
}
```

`.unique()` returns `null` when no row matches and throws when more than one matches — exactly the contract you want for a lookup by a unique key.

### Naming convention

| Shape | Behavior |
|---|---|
| `getXById` | `ctx.db.get(id)` — returns `Doc \| null` |
| `getXByIdOrThrow` | Same, throws on `null` |
| `findXByY` | Non-unique or may-be-missing — returns `Doc \| null` |
| `findXByYOrThrow` | Same, throws on `null` |

Use `get*` when fetching by `_id`; use `find*` when searching by any other field.

### Why not inline?

```typescript
// ❌ Scattered across every handler
const item = await ctx.db.get(itemId);
if (!item) throw new ConvexError({ code: 'NOT_FOUND', message: 'item not found' });

// ✅ One helper, one error shape
const item = await getItemByIdOrThrow(ctx, itemId);
```

Typed error payloads stay consistent, and new handlers inherit the behavior for free.

## Anti-patterns

> [!warning] ❌ `getItem` that silently returns null — name it `findItem`, or `getItemByIdOrThrow` and throw.

> [!warning] ❌ Throwing a string — `throw "not found"` loses structured info. Use `ConvexError({ code, message, data })`.

> [!tip] ✅ Typed not_found payload — `{ code: 'NOT_FOUND', message: '...', data: { resource, id } }` lets the frontend discriminate by `code`.

## Related Notes

- [[Helper Functions]] — helper taxonomy
- [[List Helpers]] — non-unique lookups
- [[Validation Helpers]] — pre-write assertions
- [[ConvexError Handling]] — typed error shapes
