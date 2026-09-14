---
tags: [convex, performance, indexing, queries, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-performance-audit/references/hot-path-rules
aliases: ["Hot Path Rules"]
---

# Hot Path Rules

> **Quick Summary**: Both `.filter()` and JS `.filter()` scan documents — only `.withIndex()` pushes filtering to storage. Every extra read multiplies with concurrency. Fix one function, then audit sibling functions touching the same tables.

## Rule 1: Push Filters to Storage

Convex's `.filter()` method is NOT server-side filtering — it still scans all documents. Only `.withIndex()` reduces documents scanned.

```ts
// Bad: scans entire table
const tasks = await ctx.db.query("tasks").collect();
return tasks.filter((t) => t.status === "open");

// Also bad: .filter() does not push to storage
return await ctx.db.query("tasks")
  .filter((q) => q.eq(q.field("status"), "open"))
  .collect();

// Good: withIndex pushes filtering to storage
return await ctx.db
  .query("tasks")
  .withIndex("by_status", (q) => q.eq("status", "open"))
  .collect();
```

### Redundant Index Warning

`by_foo` and `by_foo_and_bar` are usually redundant — the compound index handles both patterns. Exception: `by_foo` sorts by `foo + _creationTime`, the compound sorts by `foo + bar + _creationTime`.

```ts
// Bad: two indexes where one would do
.index("by_team", ["team"])
.index("by_team_and_user", ["team", "user"])

// Good: compound serves both
.index("by_team_and_user", ["team", "user"])
```

### Index Rollout Gotcha

`undefined !== false` — older documents missing a field won't match an index expecting `false`. Verify backfill status before switching hot-path reads to a new index. See [[migration-workflow]] for safe rollout.

## Rule 2: Minimize Data Sources

Denormalize when: path is hot, joined doc is much larger than the field needed, many readers pay the join repeatedly.

**Always fall back to the live read if denormalized data is missing:**

```ts
// Bad: placeholder blocks fallback
const ownerName = project.ownerName ?? "Unknown owner";

// Good: denormalized is optimization, live is correctness
const ownerName =
  project.ownerName ?? (await ctx.db.get(project.ownerId))?.name ?? null;
```

Rollout order when adding a denormalized field: update schema → update write path → backfill → switch read path.

## Rule 3: Minimize Row Size (Digest Tables)

Hot list pages should read the smallest document shape that answers the UI.

Use a summary/digest table when: path is hot, source documents are large, many readers pay the same payload cost.

An 800-byte summary row is materially cheaper than a 3 KB full document on a hot page. Not a default — only worth it when the path is clearly hot.

## Rule 4: Isolate Frequently-Updated Fields

Move high-churn fields (`lastSeen`, counters, presence) off widely-read documents. Every write to a shared doc invalidates all subscriptions reading it.

```ts
// Bad: every presence heartbeat invalidates all subscribers to the user profile
await ctx.db.patch(user._id, { name, avatarUrl, lastSeen: Date.now() });

// Good: split heartbeat to a separate document
await ctx.db.patch(user._id, { name, avatarUrl });
await ctx.db.patch(presence._id, { lastSeen: Date.now() });
```

## Rule 5: Consistency Rule

When you fix a hot-path pattern in one function, audit sibling functions touching the same tables for the same pattern.
