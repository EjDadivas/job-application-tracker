---
title: Relationship Helpers
description: convex-helpers/server/relationships API — getManyFrom, getManyVia, getAll for traversing 1:N and M:N relationships
type: tech
tags: [backend, helpers, convex, relationships, convex-helpers]
aliases: ["Relationship Helpers"]
---

# Relationship Helpers

> **Quick Summary**: `convex-helpers/server/relationships` replaces hand-rolled query chains for relationship traversal. Use `getManyFrom` for 1:N back-references and `getManyVia` for M:N through a junction table. Use `getAll` for parallel ID fetches.

Sources: [Database Relationship Helpers — Convex Stack](https://stack.convex.dev/functional-relationships-helpers) · [convex-helpers npm — relationship helpers](https://www.npmjs.com/package/convex-helpers#relationship-helpers)

## Install

```bash
npm install convex-helpers
```

## `getAll`

Fetch multiple documents by ID in parallel:

```ts
import { getAll } from "convex-helpers/server/relationships"

const users = await getAll(db, userIds)
// returns null for missing docs; use getAllOrThrow to throw instead
```

## `getOneFrom`

Single document via back-reference (1:1):

```ts
import { getOneFrom } from "convex-helpers/server/relationships"

const profile = await getOneFrom(db, "authorProfiles", "by_userId", user._id)
// returns null if no match; getOneFromOrThrow variant available
```

## `getManyFrom`

One-to-many — fetch all child docs pointing to a parent:

```ts
import { getManyFrom } from "convex-helpers/server/relationships"

const posts = await getManyFrom(db, "posts", "by_authorId", author._id)
```

Index naming convention: indexes named `by_<field>` let you omit the field name. For custom index names, pass the field as a fourth arg:

```ts
getManyFrom(db, "posts", "by_author", author._id, "authorId")
```

## `getManyVia`

Many-to-many — traverse a junction table and return far-side documents directly:

```ts
import { getManyVia } from "convex-helpers/server/relationships"

const categories = await getManyVia(
  db,
  "postCategories",  // junction table
  "categoryId",      // field on junction pointing to far side
  "by_post",         // index on junction keyed by near side
  post._id,          // near-side ID
)
```

## `asyncMap`

Parallel async map — useful when you need to enrich each row:

```ts
import { asyncMap } from "convex-helpers/server"

const enriched = await asyncMap(posts, async (post) => ({
  ...post,
  author: await db.get(post.authorId),
}))
```

## N+1 performance

Convex mitigates N+1 concerns because `db.get` is ~1ms (same process, no network), reads are non-locking, and query caching deduplicates identical reads within a transaction. Use `asyncMap` or `getAll` for parallel fetches when the list is large.

## Anti-patterns

> [!warning] ❌ Hand-rolling junction traversal — `getManyVia` is more readable and less error-prone.

> [!warning] ❌ Sequential `await db.get(id)` in a loop when the IDs are independent — use `getAll` or `asyncMap` for parallelism.

> [!tip] ✅ Compose helpers at the `helpers.ts` layer, not inside handlers — keeps handlers thin.

## See also

- [[Relationship Design]] — when to use junction tables vs. arrays
- [[Relationship Structures]] — 1:1, 1:N, M:N structural patterns
- [[Helper Functions]] — helper taxonomy and `ctx` typing
- [[List Helpers]] — `listXByY` pattern
