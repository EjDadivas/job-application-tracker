---
tags: [convex, performance, limits, functions, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-performance-audit/references/function-budget
aliases: ["Function Budget"]
---

# Function Budget

> **Quick Summary**: Convex transactions have hard limits on time, reads, writes, and document count. Never `.collect()` on a growing table. Break large mutations into self-scheduling batches. Move CPU-heavy work to actions.

## Key Limits

| Resource | Limit |
|---|---|
| Query/mutation execution time | 1 second (user code only) |
| Action execution time | 10 minutes |
| Data read per transaction | 16 MiB |
| Data written per transaction | 16 MiB |
| Documents scanned per transaction | 32,000 (includes `.filter()` rejects) |
| Index ranges read | 4,096 |
| Documents written | 16,000 |
| Individual document size | 1 MiB |
| Function return value size | 16 MiB |

Full list: https://docs.convex.dev/production/state/limits

## Fix Order

### 1. Bound Your Reads

```ts
// Bad: breaks as the table grows
const messages = await ctx.db.query("messages").collect();

// Good: paginate or limit
const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel", (q) => q.eq("channelId", channelId))
  .order("desc")
  .take(50);
```

### 2. Break Large Mutations Into Batches

Use cursor-based self-scheduling instead of processing all rows in one transaction:

```ts
export const backfillBatch = internalMutation({
  args: { cursor: v.optional(v.string()), batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const result = await ctx.db
      .query("items")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    for (const doc of result.page) {
      if (doc.newField === undefined) {
        await ctx.db.patch(doc._id, { newField: computeValue(doc) });
      }
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.items.backfillBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }
  },
});
```

### 3. Move Heavy Work to Actions

```ts
// Bad: CPU-heavy work inside a mutation
export const processUpload = mutation({
  handler: async (ctx, args) => {
    const result = expensiveComputation(args.data);  // eats the 1s budget
    await ctx.db.insert("results", result);
  },
});

// Good: action for heavy work, mutation for the write
export const processUpload = action({
  handler: async (ctx, args) => {
    const result = expensiveComputation(args.data);
    await ctx.runMutation(internal.results.store, { result });
  },
});
```

### 4. Trim Return Values

Only return what the client renders. Map to a smaller shape before returning:

```ts
return rows.map((r) => ({ _id: r._id, title: r.title, author: r.author }));
```

### 5. Prefer Helper Functions Over `ctx.runQuery`/`ctx.runMutation`

Inside queries and mutations, `ctx.runQuery` and `ctx.runMutation` have extra per-call overhead. Use plain TypeScript helper functions instead. Exception: components require `ctx.runQuery`/`ctx.runMutation` — use them there.

```ts
// Bad: unnecessary overhead
const user = await ctx.runQuery(api.users.getCurrentUser);

// Good: plain helper
const user = await getCurrentUser(ctx);
```

## See Also

- [[hot-path-rules]] — read amplification and digest tables
- [[migration-workflow]] — for large backfills, use @convex-dev/migrations
