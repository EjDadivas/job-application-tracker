---
tags: [frontend, tanstack, convex, react-query, adapter, mutations, queries]
related-skill: tanstack
source: https://docs.convex.dev/client/tanstack/tanstack-query/
aliases: ["Convex React Query Adapter"]
---

# Convex + TanStack Query Adapter

> **Quick Summary**: `@convex-dev/react-query` bridges Convex subscriptions into TanStack Query. Instead of polling, queries receive reactive server-push updates. Use `convexQuery` for reads and `useConvexMutation` when you need TanStack's `onSuccess`/`onError` callbacks; drop back to `convex/react` hooks for filtered queries, actions, and paginated results.

## Setup — `router.tsx`

The `ConvexQueryClient` is wired in `router.tsx` inside `getRouter()`. No `QueryClientProvider` is needed — the query client is passed via router context, and `ConvexProviderWithAuth` replaces `ConvexProvider` (it's a superset that bridges WorkOS JWTs to Convex auth).

```tsx
// src/router.tsx — inside getRouter()
const convex = new ConvexReactClient(CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

// Pass via context — no QueryClientProvider:
context: { queryClient, convexQueryClient },
Wrap: ({ children }) => (
  <AuthKitProvider>
    <ConvexProviderWithAuth client={convexQueryClient.convexClient} useAuth={useAuthFromWorkOS}>
      {children}
    </ConvexProviderWithAuth>
  </AuthKitProvider>
),
```

See [[workos-authkit-integration]] for the complete `router.tsx` wiring including `useAuthFromWorkOS`.

---

## Reading data — `convexQuery` + `useQuery`

```tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../convex/_generated/api";

const { data, isPending, error } = useQuery(
  convexQuery(api.messages.list, {}),
);
```

Spread extra TanStack options alongside `convexQuery`:

```tsx
const { data } = useQuery({
  ...convexQuery(api.messages.list, {}),
  initialData: [],          // avoid undefined on first render
  gcTime: 10_000,           // stay subscribed 10 s after unmount (default: 5 min)
});
```

---

## Writing data — `useConvexMutation` + `useMutation`

Use `useConvexMutation` when you need TanStack's `onSuccess` / `onError` / `onSettled` callbacks — e.g. to navigate after success or set local error state:

```tsx
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../convex/_generated/api";

const { mutate: createProject, isPending } = useMutation({
  mutationFn: useConvexMutation(api.functions.projects.create),
  onSuccess: (projectId) => {
    navigate({ to: `/dashboard/projects/${projectId}` });
  },
  onError: (err: Error) => {
    const data = (err as any).data;
    setError(data?.message ?? "Failed to create project");
  },
});
```

`useConvexMutation` is a re-export of Convex React's own `useMutation` wrapped for TanStack — it passes the mutation's returned value to `onSuccess`.

> **No manual invalidation needed.** Convex queries update reactively; calling `queryClient.invalidateQueries` after a mutation is unnecessary.

---

## When to use `convex/react` hooks directly

The adapter doesn't cover every Convex feature. Drop back to `convex/react` for:

| Use case | Hook |
|---|---|
| Filtered / parameterised queries (complex args) | `useQuery` from `convex/react` |
| Paginated results | `usePaginatedQuery` |
| Actions | `useAction` from `convex/react` |
| Mutations where you don't need TanStack callbacks | `useMutation` from `convex/react` |

`useAction` example:

```tsx
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';

function SyncButton({ itemId }: { itemId: Id<'items'> }) {
  const syncItem = useAction(api.functions.items.syncFromThirdParty);

  async function handleSync() {
    try {
      await syncItem({ itemId });
      toast.success('Synced');
    } catch (error) {
      handleConvexError(error);
    }
  }

  return <button onClick={handleSync}>Sync</button>;
}
```

Actions run outside Convex's reactive system — they don't subscribe to data, they fire once.

Both families reference the same underlying `ConvexReactClient`, so mixing them is safe — results stay consistent.

```tsx
// Mixing in the same component is fine
import { Authenticated, useQuery } from "convex/react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery as useTSQuery } from "@tanstack/react-query";

// Preloaded via loader (TanStack Query)
const { data: projects } = useTSQuery(
  convexQuery(api.functions.projects.list, {}),
);

// Filtered query with dynamic args (convex/react)
const resources = useQuery(api.functions.resources.listWithDetails, {
  type: selectedType ?? undefined,
  tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
  projectId: id as Id<"projects">,
});
```

---

## Behavioral differences from polling-based `fetch`

| Property | Convex adapter | fetch + TanStack |
|---|---|---|
| Updates | Server-push (WebSocket) | Poll / refetch |
| `isStale` | Always `false` | Depends on `staleTime` |
| `retry` | Handled internally by Convex | Configurable via `retry` |
| `refetch` | Ignored — always live | On-demand |
| Subscription lifetime | `gcTime` after last subscriber | Cache TTL |

Subscriptions stay active for `gcTime` (default 5 min) after the last component unmounts. Subsequent navigations to the same route will receive already-live data. Open React Query Devtools to observe active subscriptions while navigating.

---

## Anti-patterns

> [!warning] ❌ Calling `queryClient.invalidateQueries` after a Convex mutation
> Convex queries update reactively — manual invalidation is redundant noise.

> [!warning] ❌ Using `useConvexMutation` when you don't need TanStack callbacks
> `useMutation` from `convex/react` is simpler for fire-and-forget writes.

> [!warning] ❌ Using `ConvexProvider` instead of `ConvexProviderWithAuth`
> `ConvexProvider` has no auth capability — Convex requests won't carry JWT tokens. Use `ConvexProviderWithAuth` with the `useAuthFromWorkOS` adapter (see [[workos-authkit-integration]]). Standard Convex hooks (`usePaginatedQuery`, `useAction`, `Authenticated`) work through `ConvexProviderWithAuth` unchanged.

---

## Related Notes

- [[convex-tanstack-start-ssr]] — `useSuspenseQuery`, loaders, consistent timestamps
- [[TanStack Mutations]] — optimistic update recipe
- [[Preload and Suspense Queries]] — SSR / hydration pitfalls
- [[frontend-error-handling]] — catching `ConvexError` in mutation callbacks
- [[toast-notifications]] — toast patterns for Convex mutations
