---
title: Database Triggers
description: customMutation wrapper + Triggers registry for cascade deletes, counter updates, and denormalized mirrors via convex-helpers
type: tech
tags: [backend, convex, triggers, helpers]
created: 2026-04-25
updated: 2026-04-25
related: [[helper-functions]], [[feature-folder-layout]]
aliases: ["Database Triggers"]
---

# Database Triggers

Triggers are side-effect hooks that fire after a write to a specific table — cascade deletes, counter updates, denormalized mirror rows. The project uses the `customMutation` wrapper from `convex-helpers` so every `mutation({...})` declaration carries its triggers implicitly. Feature-owned triggers live in `convex/features/<layer>/<feature>/triggers.ts`; the root `convex/index.ts` wires them into the `customMutation` instance.

## Shape

```typescript
// convex/features/core/boards/triggers.ts
import type { MutationCtx } from "../../../_generated/server";
import type { Id } from "../../../_generated/dataModel";

export async function onBoardDeleted(
  ctx: MutationCtx,
  boardId: Id<"boards">,
): Promise<void> {
  const issues = await ctx.db
    .query("issues")
    .withIndex("by_boardId", (q) => q.eq("boardId", boardId))
    .collect();
  for (const issue of issues) {
    await ctx.db.delete(issue._id);
  }
}
```

## Wiring in `convex/index.ts`

```typescript
import { Triggers } from "convex-helpers/server/triggers";
import { customMutation } from "convex-helpers/server/customFunctions";
import { mutation as rawMutation, internalMutation as rawInternalMutation } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";

import { onBoardDeleted } from "./features/core/boards/triggers";
import { onIssueChanged } from "./features/core/issues/triggers";

const triggers = new Triggers<DataModel>();

triggers.register("boards", async (ctx, change) => {
  if (change.operation === "delete") {
    await onBoardDeleted(ctx, change.id);
  }
});

triggers.register("issues", async (ctx, change) => {
  await onIssueChanged(ctx, change);
});

export const mutation = customMutation(rawMutation, triggers.wrapDB);
export const internalMutation = customMutation(rawInternalMutation, triggers.wrapDB);
```

Once triggers are wired (this section's `customMutation` setup), feature code must import `mutation`/`internalMutation` from `convex/index.ts` so triggers fire. Until then, `_generated/server` is functionally identical — see **B-06**:
```typescript
// ✅ With customMutation wired in convex/index.ts
import { mutation } from "../../../index";
// ❌ Raw mutation bypasses triggers — but only matters once a wrapper exists
import { mutation } from "../../../_generated/server";
```

## Change payload shape

Triggers receive a `change` object describing what happened:

```typescript
type Change<T extends TableNames> =
  | { operation: "insert"; id: Id<T>; newDoc: Doc<T> }
  | { operation: "update"; id: Id<T>; oldDoc: Doc<T>; newDoc: Doc<T> }
  | { operation: "delete"; id: Id<T>; oldDoc: Doc<T> };
```

Always dispatch on `operation` to avoid running delete-cascade on every insert and update.

## Use cases

| Use case | Example |
|---|---|
| Cascade delete | Board deleted → delete all its issues, resources, threads |
| Counter maintenance | Issue inserted → `boardCounters.totalIssueCount += 1` |
| Denormalized mirror | Project renamed → update the name cached on related rows |
| Audit log | Any delete → write to `auditEvents` |

## Performance ceiling

Triggers run in the same transaction as the originating mutation. Keep cascade fan-out bounded — respect Convex's per-mutation write limit. For large fan-outs, schedule the continuation from inside the trigger rather than doing it all inline.

## Testing

Triggers fire automatically via `customMutation`, so feature tests exercising `createBoard`/`deleteBoard` naturally cover them. Add direct helper tests for complex trigger logic (e.g., the cascade helper in isolation).

## Anti-patterns

> [!warning] ❌ Using raw `mutation` from `_generated/server` when a wrapper exists
> Skips the triggers registry **when one is registered**. All side effects silently don't fire. Harmless before triggers are wired. (B-06)

> [!warning] ❌ Trigger that calls an external API
> Triggers run inside the DB transaction. External calls belong in actions scheduled from the trigger.

> [!warning] ❌ Trigger with no guard on `change.operation`
> Registering for `"boards"` without checking `change.operation` runs delete-cascade on every insert and update too.

> [!tip] ✅ Trigger helpers in `triggers.ts` next to the feature
> Keeps them reviewable as a unit. Avoid inline anonymous functions in `convex/index.ts`.

## See also

- Aggregation helpers — counter rows maintained by triggers (no dedicated note yet)
- [[feature-folder-layout]] — where `triggers.ts` lives
- [[function-syntax]] — why feature code imports from `convex/index.ts`
