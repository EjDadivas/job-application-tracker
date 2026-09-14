---
tags: [backend, architecture, api]
related-skill: convex
aliases: ["Public vs Internal Functions"]
---

# Public vs Internal Functions

> **Quick Summary**: Files ending in `.public.ts` expose functions to the frontend via `api.*`; files without that suffix are backend-only via `internal.*`. Public functions must call `requireAuth`; internal functions skip auth because they're called from trusted code. When the same logic is needed in both, extract it to a helper.

> [!important] Three rules to internalize
> 1. **Shared logic** → extract to a helper in `helpers.ts`, call from both wrappers
> 2. **Public functions** → always call `requireAuth`, then any ownership check, before a write
> 3. **Internal functions** → no auth check needed; they're called from already-authenticated code

## The split

| File | Surfaces as | Callable from |
|---|---|---|
| `queries.public.ts` / `mutations.public.ts` / `actions.public.ts` | `api.features.<entity>.queries_public.getItem` (or aggregated to `api.functions.<entity>.getItem`) | Frontend + backend |
| `queries.ts` / `mutations.ts` / `actions.ts` | `internal.features.<entity>.mutations.batchUpsertItems` | Backend only (actions, workflows, scheduler) |

## Public function anatomy

```typescript
// queries.public.ts
import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTenantAccess } from "../../shared/auth";

export const getItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item) return null;
    await requireTenantAccess(ctx, item.tenantId);
    return item;
  },
});
```

**Public function checklist:**
- Explicit `args` validator.
- Explicit `returns` validator.
- `requireAuth` (or equivalent) before any read.
- Authorization check before returning resource-scoped data.

## Internal function anatomy

```typescript
// mutations.ts (internal)
import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";

export const batchUpsertItems = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    items: v.array(v.object({ externalId: v.string(), name: v.string() })),
  },
  handler: async (ctx, args) => {
    // No auth check — caller is trusted backend code
    for (const item of args.items) {
      await upsertItem(ctx, { tenantId: args.tenantId, ...item });
    }
  },
});
```

Internal functions skip auth because they run from an already-authenticated action, a trusted workflow step, or the scheduler (whose scheduling mutation did the check).

## Extract shared logic to a helper

When the same logic is needed as both a public and internal function, put the core in a helper and wrap it in both:

```typescript
// helpers.ts
export async function getItemCore(ctx: QueryCtx, itemId: Id<"items">) {
  return ctx.db.get(itemId);
}

// queries.public.ts
export const getItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return getItemCore(ctx, args.itemId);
  },
});

// queries.ts (internal)
export const getItemInternal = internalQuery({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return getItemCore(ctx, args.itemId); // No auth check needed
  },
});
```

Never duplicate logic between a public and internal version — share via helper.

## Scheduling: always internal

```typescript
// ✅ Correct
await ctx.scheduler.runAfter(0, internal.features.<entity>.runSync, { itemId });

// ❌ Wrong — scheduled context has no user identity; public auth checks will throw
await ctx.scheduler.runAfter(0, api.functions.<entity>.runSync, { itemId });
```

## Actions: public wraps, internal does

```typescript
export const syncFromThirdParty = action({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const data = await fetch("https://api.thirdparty.example/...");
    await ctx.runMutation(internal.features.<entity>.mutations.upsertItems, { data });
  },
});
```

## Anti-patterns

> [!warning] ❌ Public function without `requireAuth` — anything reachable from the frontend is reachable from any fetcher.

> [!warning] ❌ Internal function with auth checks — wasted work; makes internals harder to test in isolation.

> [!warning] ❌ Scheduling `api.*.*` — scheduled calls have no user identity; public auth will throw.

> [!warning] ❌ Duplicating logic between a public and internal version — extract the shared core to a helper instead.

## See also

- [[feature-folder-layout]] — where `.public.ts` files live
- [[api-aggregator-pattern]] — how `.public.ts` surfaces as `api.functions.*`
- [[function-syntax]] — validators + handler structure
