---
title: Relationship Structures
description: Structural patterns for 1:1, 1:N, and M:N relationships in Convex — direct references, back-reference indexes, and junction tables
type: tech
tags: [backend, schema, convex, relationships, patterns]
aliases: ["Relationship Structures"]
---

# Relationship Structures

> **Quick Summary**: Three relationship types, three structural patterns. 1:1 uses a direct reference or back-reference with `unique()`. 1:N uses an indexed FK on the child. M:N uses a junction table with dual indexes. Arrays work only for small, bounded, non-reverse-queried sets.

Source: [Relationship Structures: Let's Talk About Schemas — Convex Stack](https://stack.convex.dev/relationship-structures-let-s-talk-about-schemas)

## One-to-One

**Direct reference** — store an ID on one document:

```ts
userSettings: defineTable({
  userId: v.id("users"),
  theme: v.string(),
})
  .index("by_userId", ["userId"])
  .index("by_userId", ["userId"]).unique()  // enforce uniqueness
```

**Bidirectional** — both documents hold each other's IDs for instant lookup in either direction. Always update both in a single transaction to avoid inconsistency.

## One-to-Many

**Back-reference with index** (recommended):

```ts
comments: defineTable({
  postId: v.id("posts"),  // FK on the many side
  body: v.string(),
})
  .index("by_postId", ["postId"])
```

Query all comments for a post:
```ts
await ctx.db.query("comments")
  .withIndex("by_postId", q => q.eq("postId", post._id))
  .collect()
```

**Array on parent** (only for small, bounded, non-reverse-queried sets):
```ts
posts: defineTable({
  tagIds: v.array(v.id("tags")),  // ❌ cannot be indexed
})
```
Arrays cannot be indexed — reverse lookup ("posts with tag X") requires a full table scan.

## Many-to-Many

**Junction table** (default):

```ts
postCategories: defineTable({
  postId: v.id("posts"),
  categoryId: v.id("categories"),
})
  .index("by_post", ["postId"])
  .index("by_category", ["categoryId"])
```

Both directions get indexed lookups. Add extra columns to the junction for per-edge metadata (order, flags, timestamps).

**Composite index** for existence checks (does this pair exist?):
```ts
.index("by_post_category", ["postId", "categoryId"])
```

**Arrays on both sides** — only acceptable if lists are small, bounded, and kept in sync via single transactions. Re-check on every review.

## Decision summary

| Relationship | Structure | When |
|---|---|---|
| 1:1 | Direct reference + index | Always |
| 1:N | FK on child + index | Always |
| M:N | Junction table + dual index | Default |
| M:N (tiny) | Array on document | Bounded ≤ ~10, no reverse query, no edge metadata |

## See also

- [[Relationship Design]] — project-specific guidelines and decision checklist
- [[Relationship Helpers]] — `getManyFrom`, `getManyVia` API
- [[Schema Patterns]] — table definition and validator composition
- [[Query Indexing]] — `withIndex` usage
