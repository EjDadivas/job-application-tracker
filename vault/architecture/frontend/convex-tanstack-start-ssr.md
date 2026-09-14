---
tags: [frontend, tanstack, start, convex, ssr, loaders, suspense]
related-skill: tanstack
source: https://docs.convex.dev/client/tanstack/tanstack-start/
aliases: ["Convex + TanStack Start — SSR & Loaders"]
---

# Convex + TanStack Start — SSR & Loaders

> **Quick Summary**: Use `useSuspenseQuery(convexQuery(...))` to server-render Convex data; the client resumes live subscriptions from SSR with no loading flash. For faster page loads add `ensureQueryData` (blocking) or `prefetchQuery` (non-blocking) in route loaders. All SSR queries share a consistent logical timestamp — no torn reads across queries.

## Content

### SSR with `useSuspenseQuery`

`useSuspenseQuery` kicks off the query during the SSR pass so it arrives with the initial HTML. After hydration, Convex resumes the live WebSocket subscription — there's no flash of loading state and no redundant fetch:

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../convex/_generated/api";

function MessageList() {
  const { data } = useSuspenseQuery(convexQuery(api.messages.list, {}));
  return <ul>{data.map(m => <li key={m._id}>{m.body}</li>)}</ul>;
}
```

`useQuery` (without Suspense) does not server-render — use it when a component can handle an initial loading state.

---

### Consistent logical timestamps

During SSR all Convex queries run at the same logical timestamp, so if one query reflects a mutation the others will too. Unlike ad-hoc REST calls there's no risk of one endpoint returning stale data while another is already updated.

---

### Loaders

Route loaders run on the server for the initial page load and on the client for subsequent navigations. They also run on link hover, enabling prefetch.

#### `ensureQueryData` — block until data is ready

Use when the component requires data to render. Rendering is suspended until the query resolves:

```tsx
export const Route = createFileRoute('/posts')({
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.messages.list, {}),
    );
  },
  component: () => {
    const { data } = useSuspenseQuery(convexQuery(api.messages.list, {}));
    return data.map(m => <Message key={m._id} message={m} />);
  },
});
```

#### `prefetchQuery` — start early without blocking

Use when data is nice to have early but the component can show a loading state:

```tsx
export const Route = createFileRoute('/posts')({
  loader: async (opts) => {
    opts.context.queryClient.prefetchQuery(
      convexQuery(api.messages.list, {}),
    );
    // no await — rendering is not blocked
  },
  component: () => {
    const { data } = useQuery(convexQuery(api.messages.list, {}));
    if (!data) return <p>Loading...</p>;
    return data.map(m => <Message key={m._id} message={m} />);
  },
});
```

#### `loaderDeps` — bust cache on search param changes

When query args come from the URL, use `loaderDeps` so the loader re-runs and the cache key changes when params change:

```tsx
export const Route = createFileRoute("/posts")({
  validateSearch: (search) => ({ channel: String(search.channel ?? "") }),
  loaderDeps: ({ search: { channel } }) => ({ channel }),
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.messages.list, { channel: opts.deps.channel }),
    );
  },
});
```

---

### Subscription lifetime and debug tip

Convex subscriptions stay alive for `gcTime` (default 5 min) after the last subscriber unmounts. On client-side navigations, whether a query is already loaded depends on prior page visits in the session. Open **React Query Devtools** to observe which subscriptions are currently active.

---

### Mixing standard Convex hooks

`usePaginatedQuery` and other `convex/react` hooks work alongside TanStack hooks — they reference the same `ConvexReactClient` so results remain consistent:

```tsx
import { usePaginatedQuery } from "convex/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

// SSR'd header data via TanStack
const { data: project } = useSuspenseQuery(
  convexQuery(api.projects.get, { id }),
);

// Paginated list via standard Convex hook
const { results, loadMore } = usePaginatedQuery(
  api.messages.list,
  { projectId: id },
  { initialNumItems: 20 },
);
```

---

## Anti-patterns

> [!warning] ❌ Using `useQuery` when you want server-rendered data
> `useQuery` does not suspend during SSR — the page ships without content. Use `useSuspenseQuery` for data that must be present in the initial HTML.

> [!warning] ❌ `await prefetchQuery` — defeats the point
> `prefetchQuery` is intentionally fire-and-forget. Awaiting it makes it equivalent to `ensureQueryData` but without the semantic clarity.

> [!warning] ❌ Forgetting `loaderDeps` for URL-driven queries
> Without `loaderDeps`, changing a search param won't re-run the loader and the stale cached result is shown.

---

## Related Notes

- [[convex-react-query-adapter]] — setup, `convexQuery`, `useConvexMutation`, hook decision table
- [[convex-tanstack-start-ssr]] — streaming SSR with `defer` / `Await` (non-Convex patterns)
- [[Router Data Loading]] — `loader`, `loaderDeps`, `beforeLoad` fundamentals
- [[Preload and Suspense Queries]] — TanStack Query suspense hooks in depth
