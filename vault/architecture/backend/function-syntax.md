---
tags: [backend, convex, syntax]
related-skill: convex
aliases: ["Function Syntax"]
---

# Function Syntax

> **Quick Summary**: Every Convex function — `query`, `mutation`, `action`, and their `internal*` counterparts — is declared with an explicit `args` validator plus a `handler`. `args` is required (per official Convex rules and ESLint `@convex-dev/require-argument-validators`). A `returns` validator is optional — TypeScript inference covers the return type for in-repo callers; add `returns` only when you want a runtime contract on the response shape.

## Content

### The canonical shape

```typescript
import { query, mutation, internalMutation, action } from "../../_generated/server";
import { v } from "convex/values";

export const getItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db.get("items", args.itemId);
  },
});
```

Required pieces:
- `args` — validator object describing every input.
- `handler` — `async (ctx, args)`.

Optional:
- `returns` — validator describing exactly what the handler returns. Skip it by default; add it when you want a runtime check on the response shape (e.g. webhook payloads, public API surfaces with strict contracts).

### Four flavors

| Kind | Use when | Import |
|---|---|---|
| `query` | Read-only, cacheable, reactive | `query`, `internalQuery` |
| `mutation` | Transactional DB write | `mutation`, `internalMutation` |
| `action` | External I/O (fetch, third-party SDKs) | `action`, `internalAction` |
| HTTP action | Webhook endpoint on `http.ts` | `httpAction` |

Queries and mutations run in a deterministic, transactional environment. Actions don't — they can call `fetch` but can't read/write the DB directly. Actions call `ctx.runQuery` / `ctx.runMutation`.

### Validator quick reference

```typescript
v.string()
v.number()
v.boolean()
v.null()
v.id("items")                // Convex Id for the "items" table
v.optional(v.string())
v.array(v.string())
v.object({ a: v.string() })
v.union(v.literal("a"), v.literal("b"))
v.any()                      // escape hatch — avoid
```

### `ctx` — what's on it

```typescript
ctx.db          // queries & writes (queries/mutations only)
ctx.auth        // identity (getUserIdentity())
ctx.scheduler   // schedule future runs
ctx.storage     // file storage
ctx.runQuery / ctx.runMutation / ctx.runAction  // cross-function calls
```

### Always pass the table name to `ctx.db`

Since `convex` v1.31.0, `ctx.db.get`, `ctx.db.patch`, `ctx.db.replace`, `ctx.db.delete` all accept the table name as the first argument. Always include it.

```typescript
// ✅
await ctx.db.get("movies", movieId);
await ctx.db.patch("movies", movieId, { title: "Whiplash" });
```

ESLint rule: `@convex-dev/explicit-table-ids`.

## Useful Type Utilities

### `Infer` — derive TS type from a validator

Define a validator once, reuse it for schema and TypeScript typing:

```typescript
import { Infer, v } from "convex/values";

export const courseValidator = v.union(
  v.literal("appetizer"),
  v.literal("main"),
  v.literal("dessert"),
);

export type Course = Infer<typeof courseValidator>;
// 'appetizer' | 'main' | 'dessert'
```

### `WithoutSystemFields` — insert/update payload type

Strips `_id` and `_creationTime` when accepting input intended for `ctx.db.insert` / `ctx.db.patch`:

```typescript
import { WithoutSystemFields } from "convex/server";
import { Doc } from "../../_generated/dataModel";

export async function insertMessage(
  ctx: MutationCtx,
  values: WithoutSystemFields<Doc<"messages">>,
) {
  await ctx.db.insert("messages", values);
}
```

### `FunctionReturnType` / `UsePaginatedQueryReturnType` — infer return types on the frontend

Avoid duplicating backend return types on the client:

```typescript
import { FunctionReturnType } from "convex/server";
import { UsePaginatedQueryReturnType } from "convex/react";
import { api } from "../../convex/_generated/api";

function MyComponent(props: {
  data: FunctionReturnType<typeof api.myFunctions.getSomething>;
}) { /* ... */ }

function PaginatedComponent(props: {
  data: UsePaginatedQueryReturnType<typeof api.myFunctions.getList>;
}) { /* ... */ }
```

## Anti-patterns

> [!warning] ❌ Missing `args` validator — leaves the input contract implicit. ESLint: `@convex-dev/require-argument-validators`.

> [!warning] ❌ Using `v.any()` as a shortcut — defeats the validator; model the shape explicitly.

> [!warning] ❌ Unawaited `ctx.scheduler.runAfter`, `ctx.db.patch`, etc. — silent loss. Enable [`no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/).

> [!warning] ❌ `.filter` on `ctx.db.query` — still scans the full table. Use `.withIndex` or `.withSearchIndex`; reserve `.filter` for post-filtering an already-indexed result. ESLint: `@convex-dev/no-filter-in-query`. See [[hot-path-rules]].

> [!warning] ❌ Unbounded `.collect` — every scanned doc (including filtered-out ones) counts toward bandwidth limits. Use an index to narrow first, `.take(n)`, or paginate. ESLint: `@convex-dev/no-collect-in-query`. See [[function-budget]].

> [!warning] ❌ Redundant indexes — `by_foo` + `by_foo_and_bar` are usually duplicates; drop the prefix. Exception: different sort keys (`_creationTime` vs `bar`). See [[hot-path-rules]].

> [!warning] ❌ Using user-supplied email or name as an access control key — can be spoofed. Use `ctx.auth.getUserIdentity()`. Prefer granular functions (`setTeamOwner`) over generic ones (`updateTeam`). See [[auth-overview]], [[validation-helpers]].

> [!warning] ❌ DB writes inside an action — actions can't call `ctx.db`; call an internal mutation.

> [!warning] ❌ Omitting the table name on `ctx.db.get`/`patch`/`replace`/`delete` — the first argument is required since v1.31.0. ESLint: `@convex-dev/explicit-table-ids`.

> [!tip] ✅ If you do declare `returns`, use `v.null()` for void returns.

## Related Notes

- [[public-vs-internal-functions]] — which variant to export
- [[Schema Patterns]] — composing validators into tables
- [[Helper Functions]] — where non-function logic lives
- [[api-aggregator-pattern]] — how public functions surface to the frontend
