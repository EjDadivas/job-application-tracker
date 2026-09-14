---
tags: [backend, helpers, convex, patterns]
related-skill: convex
aliases: ["Helper Functions"]
---

# Helper Functions

> **Quick Summary**: Handler logic that accepts `ctx` and touches the DB belongs in the feature's `helpers.ts`, not inside `query`/`mutation` handlers. Helpers are plain TypeScript `async` functions — no `query({...})` wrapper — so they compose cleanly across public and internal functions without duplicating boilerplate. `utils.ts` is for pure functions (no `ctx`).

## Content

### The rule

```typescript
// helpers.ts — anything that needs ctx
export async function getItemByIdOrThrow(
  ctx: QueryCtx,
  itemId: Id<"items">,
): Promise<Doc<"items">> {
  const item = await ctx.db.get(itemId);
  if (!item) throw new ConvexError({ code: 'NOT_FOUND', message: 'item not found', data: { resource: 'item' } });
  return item;
}

// queries.public.ts — handler stays tiny
export const getItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await getItemByIdOrThrow(ctx, args.itemId);
  },
});
```

Handlers orchestrate; helpers do.

### Typing the `ctx`

| Helper type | `ctx` param type |
|---|---|
| Read-only | `QueryCtx` |
| Writes | `MutationCtx` |
| External I/O | `ActionCtx` |

Pick the narrowest context that works — a read-only helper typed `QueryCtx` can be called from both queries and mutations.

### Helper categories

| Kind | Shape | Note |
|---|---|---|
| Lookup | `getXByIdOrThrow(ctx, id)` | [[Lookup Helpers]] |
| List | `listXByY(ctx, y)` | [[List Helpers]] |
| Upsert | `upsertX(ctx, keyedInput)` | [[Upsert Helpers]] |
| Batch | `batchUpsertX(ctx, items)` | [[Batch Helpers]] |
| Validation | `assertUniqueSlug(ctx, ...)` | [[Validation Helpers]] |

### `helpers.ts` vs `utils.ts`

```typescript
// helpers.ts — accepts ctx, touches DB
export async function getItemByIdOrThrow(ctx: QueryCtx, id: Id<"items">) { ... }

// utils.ts — pure, no ctx
export function formatSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
```

Rule of thumb: if the function takes `ctx`, it's a helper; otherwise it's a util.

### Prefer helpers over `ctx.runQuery`/`ctx.runMutation` inside queries and mutations

Each `ctx.run*` call is a separate transaction boundary with per-call overhead. Inside a query or mutation, a plain TS helper is faster and stays consistent within one transaction.

```typescript
// ❌ — extra transaction, extra latency
const item = await ctx.runQuery(internal.features.items.getItem, { id });

// ✅ — same transaction, no overhead
const item = await getItemByIdOrThrow(ctx, id);
```

Exceptions: components require `ctx.runQuery`/`ctx.runMutation`; partial rollback inside a mutation requires `ctx.runMutation`.

### Don't serialize `ctx.run*` calls from an action

Sequential `ctx.runQuery` / `ctx.runMutation` calls from an action each run in their own transaction — results can diverge between calls. Combine them into one internal function that returns the combined shape.

```typescript
// ❌ — two transactions, possibly inconsistent snapshots
const team = await ctx.runQuery(internal.teams.getTeam, { teamId });
const owner = await ctx.runQuery(internal.teams.getTeamOwner, { teamId });

// ✅ — one consistent transaction
const { team, owner } = await ctx.runQuery(internal.teams.getTeamAndOwner, { teamId });
```

### `ctx.runAction` is for cross-runtime only

Only use `ctx.runAction` when you need Node.js-specific code from the Convex runtime. Otherwise call a plain TS function.

## Anti-patterns

> [!warning] ❌ Wrapping a helper in `query({...})` unnecessarily — calling via `ctx.runQuery` adds latency and breaks transactional guarantees.

> [!warning] ❌ Duplicating helper logic across features — promote to `shared/` instead of copying.

> [!warning] ❌ Pure code in `helpers.ts` — formatters and constants belong in `utils.ts`.

> [!warning] ❌ Sequential `ctx.runQuery` calls from an action — combine into a single internal query instead.

> [!warning] ❌ `ctx.runAction` for same-runtime logic — just call the TS function.

> [!tip] ✅ Helpers throw — handlers catch-or-propagate. `getXByIdOrThrow` keeps handler logic linear.

## Related Notes

- [[Lookup Helpers]] — `getXByIdOrThrow` pattern
- [[List Helpers]] — `listXByY` pattern
- [[Upsert Helpers]] — upsert by natural key
- [[Feature Folder Layout]] — `helpers.ts` vs `utils.ts`
- [[Function Syntax]] — where helpers are called from
