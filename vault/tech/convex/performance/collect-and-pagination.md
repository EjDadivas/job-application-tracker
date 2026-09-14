---
title: Collect, Bounds, and Pagination
description: When .collect() is safe vs .take(n) vs .paginate() — decision rules, pagination pattern, and counting paginated results
type: tech
tags: [backend, convex, queries, pagination, performance]
created: 2026-04-25
updated: 2026-04-25
related: [[query-indexing]], [[compound-index-ordering]], [[avoiding-n-plus-one]]
aliases: ["Collect Bounds and Pagination"]
---

# Collect, Bounds, and Pagination

`.collect()` loads every row matched by the index — safe only when that set is bounded. `.take(n)` limits to the first `n`. `.paginate(opts)` is the right choice for user-facing lists where row count can grow unbounded. Pick based on "what's the biggest plausible result set?" — if you can't answer, paginate. See **B-04**.

## The three terminators

```typescript
const q = ctx.db.query("issues")
  .withIndex("by_boardId", (i) => i.eq("boardId", boardId));

await q.collect();                                         // ALL rows
await q.take(20);                                          // first 20
await q.paginate({ numItems: 20, cursor: null });          // one page + cursor
```

All three require an index — without one, you're scanning.

## When `.collect()` is safe

| Condition | Safe? |
|---|---|
| Index narrows to a single tenant with bounded size (e.g. board columns, workspace members) | ✅ |
| Index narrows to something that could grow (e.g. all issues on a board) | ❌ |
| No index narrowing at all | ❌ never |

Every `.collect()` in feature code should pass a "what's the max?" review.

## When `.take(n)` is safe

Use for "give me the latest N" or "any rows matching?" checks — still needs an index:

```typescript
// "Is there at least one?"
const first = await ctx.db.query("issues")
  .withIndex("by_boardId_status", q => q.eq("boardId", boardId).eq("status", "open"))
  .take(1);
const hasOpen = first.length > 0;
```

More efficient than `.collect().length > 0`.

## Pagination

```typescript
import type { PaginationOptions, PaginationResult } from "convex/server";

export const listIssuesByBoard = query({
  args: {
    boardId: v.id("boards"),
    opts: v.object({ numItems: v.number(), cursor: v.union(v.string(), v.null()) }),
  },
  handler: async (ctx, args): Promise<PaginationResult<Doc<"issues">>> => {
    await requireAuth(ctx);
    return await ctx.db.query("issues")
      .withIndex("by_boardId_createdAt", q => q.eq("boardId", args.boardId))
      .order("desc")
      .paginate(args.opts);
  },
});
```

Frontend:
```typescript
const { results, status, loadMore } = usePaginatedQuery(
  api.functions.issues.listIssuesByBoard,
  { boardId },
  { initialNumItems: 20 },
);
```

`usePaginatedQuery` manages the cursor automatically.

### Pagination isn't a silver bullet

Pagination pages the query *result* — the index must still narrow. Paginating a table scan means each page still scans. Always pair `.paginate` with `.withIndex`.

## Counting paginated results

You can't `.count()` a paginated query efficiently. Options:
- Maintain a counter row updated via a [[database-triggers|trigger]].
- Use the Convex aggregate component for precise counts across large scopes.
- Display "loaded N so far" from the frontend rather than a total.

## Anti-patterns

> [!warning] ❌ `.collect()` without a narrowing index
> Scans the entire table. Always narrow first.

> [!warning] ❌ `(await q.collect())[0]` to get the first row
> Loads all rows to return one. Use `.first()` or `.take(1)`.

> [!warning] ❌ `.slice()` on a `.collect()` result
> Loaded too much. Use `.take(n)` or paginate.

> [!warning] ❌ Paginating without `.order(...)`
> Result order is stable only if the index orders it. Always pair paginate with an ordered index.

> [!tip] ✅ If the query could ever grow unbounded, paginate from day one
> Retrofitting pagination onto a list endpoint is painful — frontends often use `results: Doc[]` directly. Start paginated.

## See also

- [[query-indexing]] — `.withIndex` is required before any terminator
- [[compound-index-ordering]] — ordered paginate relies on the index order
- Aggregation helpers — counters for paginated tables (no dedicated note yet)
- [[avoiding-n-plus-one]] — don't loop `ctx.db.get` inside a page
