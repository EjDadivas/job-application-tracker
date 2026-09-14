---
tags: [backend, schema, convex, validators]
related-skill: convex
aliases: ["Schema Patterns"]
---

# Schema Patterns

> **Quick Summary**: Inside a feature's `schema.ts`, tables are built with `defineTable({ ... })` using `v.*` validators for every column, then chained with `.index(...)` for any field combination you'll query on. Every read path needs a matching index — otherwise `.filter()` scans. See [[Modular Schema]] for the per-feature file layout and [[Query Indexing]] for how these indexes get consumed.

## Content

### Table definition

```typescript
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

Auto-fields `_id` and `_creationTime` are free — don't redefine.

### Validator composition

```typescript
v.optional(v.string())
v.array(v.id("items"))
v.union(v.literal("todo"), v.literal("doing"), v.literal("done"))
v.object({ street: v.string(), city: v.string() })

// Union of tagged object shapes
v.union(
  v.object({ kind: v.literal("email"), email: v.string() }),
  v.object({ kind: v.literal("phone"), phone: v.string() }),
)
```

### Index naming convention

```
by_<field1>[_<field2>][_<field3>]
```

The order in the name **matches** the order in the column list — it's documentation of [[Compound Index Ordering]].

### Common shapes

**Soft-delete**
```typescript
defineTable({
  name: v.string(),
  archivedAt: v.optional(v.number()),  // undefined = live
})
  .index("by_archivedAt", ["archivedAt"]);
```

**Enumerated state**
```typescript
status: v.union(
  v.literal("open"),
  v.literal("resolved"),
  v.literal("archived"),
),
```

**Polymorphic foreign reference**
```typescript
v.object({
  kind: v.union(v.literal("item"), v.literal("comment")),
  id: v.union(v.id("items"), v.id("comments")),
})
```

### Index guidelines

- If you query by field X, index X.
- If you query by X and filter by Y, compound `[X, Y]`.
- Equality-then-range (`[tenantId, _creationTime]`) beats separate indexes.

## Anti-patterns

> [!warning] ❌ Defining `createdAt` alongside `_creationTime` — duplicates a system field.

> [!warning] ❌ Stringly-typed enums — `status: v.string()` loses compile-time safety. Use `v.union(v.literal(...))`.

> [!warning] ❌ No index on the field you query by — forces `.filter()` scans.

> [!tip] ✅ Optional, not nullable — prefer `v.optional(v.string())` over `v.union(v.string(), v.null())`.

## Related Notes

- [[Modular Schema]] — how feature tables aggregate into the root schema
- [[Query Indexing]] — using `.withIndex(...)` against these indexes
- [[Compound Index Ordering]] — ordering rules for multi-column indexes
- [[Function Syntax]] — using `v.*` validators in function `args` / `returns`
- [[Feature Folder Layout]] — where `schema.ts` lives per feature
