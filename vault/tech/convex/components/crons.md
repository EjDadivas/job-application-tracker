---
title: Crons (Dynamic)
description: Dynamic runtime cron registration — extends Convex's static built-in crons with programmatic create/update/delete from mutations
type: tech
tags: [convex, durable-functions, crons, scheduling]
created: 2026-04-25
updated: 2026-04-25
related: [[workpool]], [[workflow]]
source: https://www.convex.dev/components/crons
---

# Crons (Dynamic)

`@convex-dev/crons` — enables **runtime** registration and management of cron jobs. Convex's built-in `crons.ts` is static (defined at deploy time); this component lets you create, update, and delete scheduled jobs from within mutations, enabling tenant-specific schedules, user-triggered automation, and self-managing workflows.

## Setup

```bash
npm install @convex-dev/crons
```

```ts
// convex/convex.config.ts
import crons from "@convex-dev/crons/convex.config.js";
const app = defineApp();
app.use(crons);
export default app;

// convex/crons.ts
import { Crons } from "@convex-dev/crons";
import { components } from "./_generated/api";

export const cronManager = new Crons(components.crons);
```

## API

```ts
// Register — schedule spec can be cron expression OR ms interval
const jobId = await cronManager.register(ctx, 
  { kind: "cron", cronspec: "0 9 * * 1" },          // every Monday at 9am
  internal.reports.generateWeekly, 
  { orgId },
  "weekly-report-org-123"   // optional name for later retrieval
);

// Or with ms interval
await cronManager.register(ctx,
  { kind: "interval", ms: 60_000 },
  internal.monitoring.heartbeat,
  {}
);

// Get by name
const job = await cronManager.get(ctx, "weekly-report-org-123");

// List all registered jobs
const jobs = await cronManager.list(ctx);

// Delete by name
await cronManager.delete(ctx, "weekly-report-org-123");
```

## Key non-obvious behaviors

**Transactional creation:** `register()` runs inside a mutation transaction — if the surrounding mutation rolls back, the cron is not created. This enables atomic patterns like "create user → schedule their weekly digest" in one transaction.

**Self-deleting crons:** A cron job can call `cronManager.delete(ctx, "my-name")` from within itself to run exactly once (or to reschedule itself dynamically).

**Idempotent init:** For static-like jobs, check existence before registering:
```ts
const existing = await cronManager.get(ctx, "daily-cleanup");
if (!existing) {
  await cronManager.register(ctx, { kind: "cron", cronspec: "0 2 * * *" }, 
    internal.cleanup.run, {}, "daily-cleanup");
}
```

## Use cases

- Per-tenant scheduled reports or billing cycles
- User-configured maintenance windows via app UI
- Event-driven temporary tasks (e.g. reminder N days after signup)
- Self-deleting one-shot jobs

## See also

- [[workpool]] — for throttled/priority async work triggered by events
- [[workflow]] — for multi-step processes that run once
