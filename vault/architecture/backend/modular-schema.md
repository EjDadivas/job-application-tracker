---
tags: [backend, architecture, schema, convex]
related-skill: convex
aliases: ["Modular Schema"]
---

# Modular Schema

> **Quick Summary**: Each feature owns a `schema.ts` that exports a named object (e.g. `itemTables`). The root `convex/schema.ts` spreads every feature's tables into one `defineSchema({ ...a, ...b, ... })`. Keeps table definitions next to the feature code, eliminates merge conflicts on a god-file schema, and makes ownership obvious.

## Content

### Per-feature schema

```typescript
// convex/features/<entity>/schema.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const itemTables = {
  items: defineTable({
    name: v.string(),
    slug: v.string(),
    tenantId: v.id("tenants"),
    archivedAt: v.optional(v.number()),
  })
    .index("by_tenantId", ["tenantId"])
    .index("by_slug_tenantId", ["slug", "tenantId"]),
};
```

### Root schema aggregation

```typescript
// convex/schema.ts
import { defineSchema } from "convex/server";
import { itemTables } from "./features/<entity-a>/schema";
import { otherTables } from "./features/<entity-b>/schema";

export default defineSchema({
  ...itemTables,
  ...otherTables,
});
```

### Naming convention

Feature exports are suffixed `Tables`:

```typescript
export const itemTables = { ... };   // not itemSchema
```

Each entry uses the canonical table name (lowercase snake_case where multi-word):

```typescript
{ item_tags: defineTable({ ... }) }
```

### Benefits

| Benefit | Why it matters |
|---|---|
| Merge-conflict reduction | Two features edit different files |
| Clear ownership | Feature folder owns everything about its tables |

### Auto-generated system fields

Every table has:
- `_id: Id<"tableName">`
- `_creationTime: number`

Don't redefine these. Add `archivedAt`, `updatedAt` etc. as needed.

## Anti-patterns

> [!warning] ❌ One giant `schema.ts` at the root — every change becomes a merge conflict.

> [!warning] ❌ Duplicating `createdAt` alongside `_creationTime` — drift guaranteed.

> [!tip] ✅ Keep indexes in the same file as the table — never inline in a query.

## Related Notes

- [[feature-folder-layout]] — where `schema.ts` lives per feature
- [[Schema Patterns]] — validators, indexes, common table shapes
- [[Query Indexing]] — how indexes defined here get used
