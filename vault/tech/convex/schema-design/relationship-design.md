---
title: Relationship Design
description: Decision guide for modeling 1:N and M:N relationships — junction tables vs. arrays, with indexed lookups in both directions
type: tech
tags: [backend, schema, convex, relationships, junction-table, indexes]
aliases: ["Relationship Design"]
---

# Relationship Design

Sources: [Convex Docs — References and Relationships](https://docs.convex.dev/database/document-ids#references-and-relationships) · [convex-demos — Relational Data Modeling](https://github.com/get-convex/convex-demos/tree/main/relational-data-modeling)

> **Quick Summary**: Use a junction table for every M:N relationship. Arrays of IDs on a document are only acceptable when the list is bounded (~10 entries) AND never reverse-queried. If either check fails, it's a junction. See the decision checklist below.

## The core constraint

Convex supports `v.array(v.id(...))` for storing references but **array fields cannot be indexed**. This splits lookup cost:

- **Forward** ("this doc's referenced IDs") — cheap; it's a field read.
- **Reverse** ("documents that reference ID X") — **full table scan** over the owning table.

A junction table with one index per side gives both directions an indexed lookup.

## Junction table pattern

```ts
// instead of: posts: { ..., categoryIds: v.array(v.id("categories")) }
postCategories: defineTable({
  postId: v.id("posts"),
  categoryId: v.id("categories"),
})
  .index("by_post", ["postId"])
  .index("by_category", ["categoryId"])
```

Query either side with `withIndex`:

```ts
// posts in a category
await ctx.db.query("postCategories")
  .withIndex("by_category", q => q.eq("categoryId", id))
  .collect()

// categories for a post
await ctx.db.query("postCategories")
  .withIndex("by_post", q => q.eq("postId", id))
  .collect()
```

## When arrays are acceptable

Only when **all three** hold:

1. **Bounded** — natural ceiling ≤ ~10 entries per document (hard cap: 8,192).
2. **No reverse query** — no hot-path query asks "which docs reference this ID?".
3. **No per-edge metadata** — no "primary" flag, ordering, or per-edge timestamp.

> Bounded enum tables (days-of-week, small role lists) often *look* like array candidates — they meet (1) but usually fail (2): "shows airing on Monday" is a reverse query that scans the **owning table** (which can be large), not the 7-row enum. When in doubt, junction.

## Decision checklist

Run for each M:N edge:

- [ ] Does any query ask "which X's reference this Y?" — if yes, **junction**.
- [ ] Can the list grow past ~10 per document now or later? — if yes, **junction**.
- [ ] Does the edge carry metadata (order, flag, timestamp)? — if yes, **junction**.
- [ ] All three answers no? — array is acceptable; re-check on review.

## Helpers

Use `getManyVia` / `getManyFrom` from `convex-helpers/server/relationships` instead of hand-rolled chains:

```ts
import { getManyVia, getManyFrom } from "convex-helpers/server/relationships"

// M:N — categories for a post via junction
const categories = await getManyVia(
  db, "postCategories", "categoryId", "by_post", post._id,
)

// 1:N — posts by author
const posts = await getManyFrom(db, "posts", "by_authorId", author._id)
```

See [[Relationship Helpers]] for the full API.

## Other Convex gotchas

- **Indexes are explicit** — you pick the index with `withIndex(...)`. `filter()` runs after the query reads its rows; never use it as a substitute for an index on anything scale-sensitive.
- **Reads are row-at-a-time** — there is no SQL-style join. After fetching junction rows, get the far side with `ctx.db.get(id)` or `getAll` from convex-helpers.
- **Idempotent imports** — junction rows should be dedup'd on the `(parentId, childId)` pair at import time. They don't need their own `_airtableId`; the pair is their natural key.

## Anti-patterns

> [!warning] ❌ `v.array(v.id(...))` for a relationship you'll ever reverse-query — requires a full table scan.

> [!warning] ❌ Using `.filter()` to find "which docs reference this ID?" — index it or junction it.

> [!tip] ✅ Start normalized (junction tables); only denormalize to arrays when you've proven the three conditions above hold.

## See also

- [[Relationship Structures]] — 1:1, 1:N, M:N patterns from Convex Stack
- [[Relationship Helpers]] — `getManyFrom`, `getManyVia`, `getAll` API
- [[Schema Patterns]] — table definition and validator composition
- [[Query Indexing]] — how `withIndex` consumes these indexes
- [[Compound Index Ordering]] — ordering rules for multi-column indexes
