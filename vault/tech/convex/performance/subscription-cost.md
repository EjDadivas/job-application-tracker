---
tags: [convex, performance, subscriptions, reactivity, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-performance-audit/references/subscription-cost
aliases: ["Subscription Cost"]
---

# Subscription Cost

> **Quick Summary**: Every `useQuery` creates a live subscription that re-runs whenever its read set changes. Don't eliminate subscriptions by default — reduce *unnecessary* invalidation. Cost scales with `subscriptions × invalidation_frequency × query_cost`.

## Symptoms

- High active subscription count in dashboard
- Sluggish UI despite fast individual queries
- Many React re-renders from Convex state
- `usePaginatedQuery` with many loaded pages all staying live

## Key Fixes

### 1. Use Point-in-Time Reads When Live Updates Aren't Needed

Keep `useQuery` by default when users expect live data. Switch to a point-in-time read when:
- The flow is high-read
- Data changes less often than users need to see it
- Explicit or periodic refresh is acceptable

```ts
// Good: reactive for collaborative features
const presence = useQuery(api.teams.livePresence, { teamId });

// Good: point-in-time for a snapshot/report
import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
client.query(api.items.snapshot).then(setItems);
```

### 2. Batch Related Data Into Fewer Queries

N components each fetching their own related data = N subscriptions. Fetch in a parent query instead:

```ts
// Bad: 20 cards → 20 subscriptions
function ProjectCard({ project }) {
  const author = useQuery(api.users.get, { id: project.authorId });
  // ...
}

// Good: one query, one subscription
function ProjectList() {
  const projects = useQuery(api.projects.listWithAuthors);
  // ...
}
```

Only better if the combined query doesn't become much broader and invalidate more often.

### 3. Skip When Args Aren't Ready

```ts
// Bad: subscribes with undefined args
const profile = useQuery(api.users.getProfile, { userId: selectedId! });

// Good: skip when nothing to fetch
const profile = useQuery(api.users.getProfile, selectedId ? { userId: selectedId } : "skip");
```

### 4. Isolate Frequently-Updated Fields

Fields like `lastSeen`, counters, or presence on widely-read documents invalidate every query touching that document on every write:

```ts
// Bad: heartbeat invalidates all profile subscribers
users: defineTable({ name: v.string(), email: v.string(), lastSeen: v.number() });

// Good: split to a separate document
users: defineTable({ name: v.string(), email: v.string() });
heartbeats: defineTable({ userId: v.id("users"), lastSeen: v.number() });
```

### 5. Use Aggregate Component for Counts/Sums

Global `COUNT(*)` queries invalidate on every insert/delete. Use `@convex-dev/aggregate` for leaderboards, totals, or "X items" badges instead of reactive table scans.

### 6. Remove `Date.now()` from Queries

`Date.now()` inside a query defeats the query cache, causing frequent re-evaluation even when underlying data hasn't changed. Pass time as an argument, rounded to a coarse interval.

```ts
// Bad: defeats query caching
.withIndex("by_released_at", (q) => q.lte("releasedAt", Date.now()))

// Good: boolean updated by a scheduled function
.withIndex("by_is_released", (q) => q.eq("isReleased", true))
```

### 7. Narrow Query Read Sets

Return only fields needed. Use digest tables for hot list pages — writes to fields not in the digest won't invalidate the digest query.

## See Also

- [[hot-path-rules]] — digest tables and read set minimization
- [[occ-conflicts]] — write contention on the same documents
