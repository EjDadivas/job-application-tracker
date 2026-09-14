---
title: Workpool
description: Parallel execution queues for Convex actions/mutations with configurable parallelism, retry, and onComplete callbacks
type: tech
tags: [convex, durable-functions, workpool, async, retry]
created: 2026-04-25
updated: 2026-04-25
related: [[workflow]], [[action-retrier]], [[occ-conflicts]]
source: https://www.convex.dev/components/workpool
---

# Workpool

`@convex-dev/workpool` — organizes async work into separate queues with configurable parallelism, retry logic, and reactive status tracking. Use instead of `ctx.scheduler.runAfter()` when you need throttling, priority separation, or reliable retry.

## Setup

```bash
npm install @convex-dev/workpool
```

```ts
// convex/convex.config.ts
import workpool from "@convex-dev/workpool/convex.config.js";

const app = defineApp();
app.use(workpool, { name: "emailWorkpool" });
app.use(workpool, { name: "scrapeWorkpool" });
export default app;
```

```ts
// convex/workpools.ts (or wherever needed)
import { Workpool } from "@convex-dev/workpool";
import { components } from "./_generated/api";

export const emailPool = new Workpool(components.emailWorkpool, {
  maxParallelism: 10,
});
export const scrapePool = new Workpool(components.scrapeWorkpool, {
  maxParallelism: 5,
});
```

**Parallelism limits:** stay under **100 on Pro, 20 on free** — counts across ALL workpools AND workflows combined.

## Enqueueing work

```ts
// Single action
await emailPool.enqueueAction(ctx, internal.auth.sendVerification, { userId });

// Single mutation
await counterPool.enqueueMutation(ctx, internal.counter.increment, {});

// Batch (reduces overhead when enqueuing many at once)
await scrapePool.enqueueActionBatch(ctx, internal.weather.scrape, [
  { city: "New York" },
  { city: "Los Angeles" },
]);
```

Per-enqueue options: `retry`, `onComplete`, `context`, `runAt`, `runAfter`.

## Retry behavior

```ts
const pool = new Workpool(components.emailWorkpool, {
  retryActionsByDefault: true,
  defaultRetryBehavior: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 },
});

// Override per call
await pool.enqueueAction(ctx, internal.email.send, args, {
  retry: false, // non-idempotent — don't retry
});

// Custom retry config per call
await pool.enqueueAction(ctx, internal.email.checkStatus, args, {
  retry: { maxAttempts: 10, initialBackoffMs: 250, base: 2 },
});
```

Backoff formula: `initialBackoffMs * base^(retryNumber - 1)` with jitter. Actions in backoff do **not** occupy a parallelism slot.

## onComplete callbacks

**Runs in a different transaction than the job.** If you need same-transaction handling for the success case, do that work at the end of the enqueued function before returning.

```ts
import { vOnCompleteValidator } from "@convex-dev/workpool";

export const emailSent = internalMutation({
  args: vOnCompleteValidator(
    v.object({ emailType: v.string(), userId: v.id("users") }),
  ),
  handler: async (ctx, { workId, context, result }) => {
    if (result.kind === "canceled") return;
    // result.kind === "success" | "failed"
  },
});

// Or use the typed helper (ctx.db is fully typed with DataModel)
export const emailSent = pool.defineOnComplete<DataModel>({
  context: v.object({ emailType: v.string(), userId: v.id("users") }),
  handler: async (ctx, { workId, context, result }) => { ... },
});
```

## Status tracking

```ts
import { vWorkIdValidator } from "@convex-dev/workpool";

export const getStatus = query({
  args: { id: vWorkIdValidator },
  handler: async (ctx, args) => pool.status(ctx, args.id),
});
```

Status kinds: `{ kind: "pending"; previousAttempts: number }`, `{ kind: "running"; previousAttempts: number }`, `{ kind: "finished" }`.

Default `statusTtl`: 1 day. To keep forever: `statusTtl: Number.POSITIVE_INFINITY`.

## Cancellation

```ts
await pool.cancel(ctx, workId);   // cancel one job (won't stop in-progress work)
await pool.cancelAll(ctx);         // cancel all pending
```

## OCC conflict reduction

Use `maxParallelism: 1` to serialize mutations that read/write the same data (e.g. counters, inventory), eliminating OCC errors.

## Runtime parallelism update

```ts
// From a mutation or action:
await ctx.runMutation(components.myWorkpool.config.update, { maxParallelism: 20 });
// Also: npx convex run or the Convex dashboard
// Set to 0 to pause the pool.
```

## See also

- [[workflow]] — full durable execution with deterministic step orchestration
- [[action-retrier]] — simpler single-action retry without queues
- [[occ-conflicts]] — why serialized workpools help with OCC
