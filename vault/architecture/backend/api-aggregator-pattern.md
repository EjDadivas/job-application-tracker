---
tags: [backend, architecture, api, convex]
related-skill: convex
aliases: ["API Aggregator Pattern"]
---

# API Aggregator Pattern

> **Quick Summary**: `convex/functions/<entity>.ts` re-exports public queries/mutations from `convex/features/<entity>/*.public.ts`, giving the frontend a flat API surface (`api.functions.<entity>.getItem`) instead of the verbose feature path. Internal functions are **not** aggregated — they stay at their source path.

## Content

### Problem

Without aggregators, frontend imports are verbose and leak implementation structure:

```typescript
api.features.<entity>.queries_public.getItem
api.features.<entity>.mutations_public.createItem
```

### Solution

A thin `convex/functions/<entity>.ts` re-export file per entity:

```typescript
// convex/functions/<entity>.ts
export { getItem, listItems } from "../features/<entity>/queries.public";
export { createItem, updateItem, deleteItem } from "../features/<entity>/mutations.public";
```

Frontend uses the flat path:

```typescript
const item = useQuery(api.functions.<entity>.getItem, { itemId });
```

### Directory

```
convex/
├── functions/           ← aggregator layer
│   └── <entity>.ts
└── features/
    └── <entity>/        ← source of truth
```

### Grouping strategies

Default is **one file per entity**. You can also aggregate by layer or by feature area when a concept spans folders — same mechanism, just broader re-exports:

```typescript
// functions/<area>.ts
export { fnA } from "../features/<a>/queries.public";
export { fnB } from "../features/<b>/queries.public";
```

### Internal functions stay at source

```typescript
// ✅ Backend calls internal at the real path
await ctx.runMutation(internal.features.<entity>.mutations.batchUpsertItems, { items });

// ❌ No aggregator for internals
// internal.functions.<entity>.batchUpsertItems  // Doesn't exist
```

Only public functions need a clean frontend-facing surface. Internal calls stay explicit so backend flow is traceable.

## Anti-patterns

> [!warning] ❌ Exporting internal functions through aggregators — defeats the public/internal safety split.

> [!warning] ❌ Grouping by function kind (`functions/queries.ts`, `functions/mutations.ts`) instead of by entity.

> [!warning] ❌ Logic inside aggregator files — aggregators must be pure re-exports.

## Related Notes

- [[public-vs-internal-functions]] — why this split exists
- [[feature-folder-layout]] — where the source `.public.ts` files live
- [[function-syntax]] — shape of the underlying public functions
