---
tags: [convex, performance, occ, writes, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-performance-audit/references/occ-conflicts
aliases: ["OCC Conflict Resolution", "OCC Conflicts"]
---

# OCC Conflict Resolution

> **Quick Summary**: Convex retries transactions when read/write sets overlap. Fix order: narrow read sets first, then split hot documents, then move bookkeeping to scheduled functions. Splitting hot docs also reduces subscription invalidation.

## Symptoms

- OCC conflict errors in logs or health page
- Mutations retrying multiple times
- Latency spikes on write-heavy pages
- `npx convex insights --details` showing high conflict rates

## Common Causes

- **Hot documents**: multiple mutations writing to the same document concurrently (global counter, shared settings row, `lastUpdated` on a parent record)
- **Broad read sets**: a scan over a large table range conflicts with any write to that range, even unrelated ones
- **Trigger fan-out**: triggers run inside the same transaction — heavy trigger logic extends the read/write set. Keep triggers minimal, defer expensive derived work to `ctx.scheduler.runAfter`
- **Write-then-read chains**: under load, stacked mutations all competing on the same document

## Fix Order

### 1. Narrow Read Sets

```ts
// Bad: broad scan conflicts with any write to "tasks"
const allTasks = await ctx.db.query("tasks").collect();
const mine = allTasks.filter((t) => t.ownerId === userId);

// Good: indexed query touches only relevant documents
const mine = await ctx.db
  .query("tasks")
  .withIndex("by_owner", (q) => q.eq("ownerId", userId))
  .collect();
```

### 2. Split Hot Documents

When many writers target the same document, shard the contention point:

```ts
// Bad: every vote increments the same counter
const counter = await ctx.db.get(pollCounterId);
await ctx.db.patch(pollCounterId, { count: counter!.count + 1 });

// Good: shard across multiple documents, aggregate on read
const shardIndex = Math.floor(Math.random() * SHARD_COUNT);
await ctx.db.patch(shardIds[shardIndex], { count: shard!.count + 1 });
```

### 3. Move Bookkeeping to Scheduled Functions

```ts
// Bad: analytics work extends the transaction's read/write set
await ctx.db.patch(userId, { name: args.name });
await ctx.db.insert("userUpdateAnalytics", { userId, kind: "name_changed" });

// Good: defer non-critical work
await ctx.db.patch(userId, { name: args.name });
await ctx.scheduler.runAfter(0, internal.users.recordNameChangeAnalytics, { userId });
```

### 4. Combine Competing Writes (Last Resort)

If two mutations must update the same document atomically, combine them into a single mutation call. Don't introduce artificial locks or queues before trying the above first.

## See Also

- [[subscription-cost]] — splitting hot docs also reduces subscription invalidation
- [[hot-path-rules]] — read set reduction strategies
