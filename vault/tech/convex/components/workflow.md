---
title: Workflow
description: Durable execution for long-running Convex processes that survive restarts, with step orchestration, retries, and reactive status
type: tech
tags: [convex, durable-functions, workflow, durable-execution]
created: 2026-04-25
updated: 2026-04-25
related: [[workpool]], [[action-retrier]]
source: https://www.convex.dev/components/workflow
---

# Workflow

`@convex-dev/workflow` — durable execution for Convex. Workflows survive server restarts and combine queries, mutations, and actions into deterministic multi-step processes with configurable retries, parallel steps, and reactive status.

## Setup

```bash
npm install @convex-dev/workflow
```

## Non-determinism restrictions

The component **blocks** direct `fetch` calls and **patches** non-deterministic APIs like `Math.random()` to ensure reproducible replay across restarts. All I/O must go through `ctx.runAction()` steps.

## API surface

```ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

const workflow = new WorkflowManager(components.workflow);

// Define a workflow
export const onboardUser = workflow.define({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Steps via ctx.runQuery / ctx.runMutation / ctx.runAction
    const profile = await ctx.runQuery(internal.users.getProfile, { userId: args.userId });

    // Parallel steps
    const [emailResult, contentResult] = await Promise.all([
      ctx.runAction(internal.email.sendWelcome, { userId: args.userId }),
      ctx.runAction(internal.content.generate, { userId: args.userId }),
    ]);

    await ctx.runMutation(internal.users.markOnboarded, { userId: args.userId });
  },
});

// Start from a mutation or action — returns WorkflowId
export const startOnboarding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const workflowId = await workflow.start(ctx, internal.onboardUser, args);
    return workflowId;
  },
});

// Status (reactive — use in a query to power UI)
const status = await workflow.status(ctx, workflowId);

// Cancel mid-execution
await workflow.cancel(ctx, workflowId);

// Restart from a specific step after fixing a bug
await workflow.restart(ctx, workflowId, { step: 2 });
```

## Idempotency (B-10)

Every step must be idempotent — retries are a guarantee, not an edge case. Design every write as "upsert by stable key," not "insert blindly":

```ts
// ❌ inserts a duplicate row on retry
await ctx.db.insert("events", { externalId, payload });

// ✅ upsert by natural key
const existing = await ctx.db.query("events")
  .withIndex("by_externalId", q => q.eq("externalId", args.externalId))
  .unique();
if (!existing) await ctx.db.insert("events", { externalId: args.externalId, payload: args.payload });
```

For external API calls, either pass an `Idempotency-Key` header or use a pending-row pattern: write `status: "pending"` in step 1, call the API in step 2, flip to `status: "done"` in step 3. On retry, steps 1 and 3 are no-ops.

## Parallelism (B-15)

By default steps run sequentially. Use `Promise.all` over `ctx.run*` for independent steps:

```ts
const [emailResult, contentResult] = await Promise.all([
  ctx.runAction(internal.email.sendWelcome, { userId: args.userId }),
  ctx.runAction(internal.content.generate, { userId: args.userId }),
]);
```

Only parallelize steps that are truly independent — parallel steps lose ordering guarantees. For hundreds of independent jobs (fan-out), use `ctx.scheduler.runAfter` instead; workflows are for orchestrated multi-step flows, not queues.

## Use cases

- Multi-day user onboarding (email verification → content generation → follow-ups)
- Payment + fulfillment coordination across multiple APIs
- Data processing pipelines with failure recovery
- Batch job orchestration with parallel workers

## See also

- [[workpool]] — priority queues with parallelism control for actions/mutations
- [[action-retrier]] — simpler single-action retry
- Workflow idempotency — upsert-by-stable-key patterns (no dedicated note yet; see B-10 in [[_conventions]])
