---
title: Action Retrier
description: Automatic exponential-backoff retry for individual Convex actions with run tracking and onComplete callback
type: tech
tags: [convex, durable-functions, retry, action-retrier]
created: 2026-04-25
updated: 2026-04-25
related: [[workpool]], [[workflow]]
source: https://www.convex.dev/components/retrier
aliases: ["Action Retrier"]
---

# Action Retrier

`@convex-dev/action-retrier` — retries failed Convex actions with exponential backoff. Simpler than [[workpool]] (no parallelism control, no queues) — use when you just need reliable retry for a single external call.

## Setup

```bash
npm install @convex-dev/action-retrier
```

```ts
import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "./_generated/api";

const retrier = new ActionRetrier(components.actionRetrier, {
  initialBackoffMs: 1000,
  base: 2,
  maxFailures: 4,
});
```

## API

```ts
// Start — call from a mutation or action, returns RunId
const runId = await retrier.run(ctx, internal.payments.charge, { userId, amount });

// Query status (use in a query for reactive UI)
const status = await retrier.status(ctx, runId);

// Cancel
await retrier.cancel(ctx, runId);

// Clean up completed run record
await retrier.cleanup(ctx, runId);
```

## onComplete callback

Called **exactly once** when the run finishes, whether it succeeded, failed, or was canceled.

```ts
await retrier.run(ctx, internal.email.send, args, {
  onComplete: internal.email.handleResult,
  context: { userId },
});
```

## Config options

| Option | Description |
|---|---|
| `initialBackoffMs` | Delay before first retry |
| `base` | Backoff multiplier (standard: 2) |
| `maxFailures` | Max retry attempts before giving up |

Backoff: `initialBackoffMs * base^(retryNumber - 1)` with jitter.

## When to prefer Workpool instead

Use [[workpool]] when you need: parallelism limits, separate queues for priority, or batch enqueueing. Action Retrier is the lighter-weight option for simple "retry until success" scenarios.

## See also

- [[workpool]] — full queue system with parallelism control
- [[workflow]] — multi-step durable orchestration
