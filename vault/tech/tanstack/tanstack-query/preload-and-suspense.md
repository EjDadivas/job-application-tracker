---
tags: [frontend, tanstack, query, suspense, ssr, prefetch]
related-skill: tanstack
aliases: ["Preload and Suspense Queries"]
---

# Preload and Suspense Queries — Pitfalls

> **Quick Summary**: `useSuspenseQuery` requires a `<Suspense>` boundary and doesn't accept `enabled: false`. In route loaders, use `ensureQueryData` (not `prefetchQuery`). Keep `staleTime` identical on server and client to avoid hydration mismatches.

## Rules worth keeping

- **`useSuspenseQuery` needs a `<Suspense>` boundary above it**. Without one, the thrown promise bubbles up and breaks the tree.
- **`useSuspenseQuery` doesn't accept `enabled: false`**. If the query is conditional, fall back to `useQuery`.
- **Use `ensureQueryData` in route loaders, not `prefetchQuery`**. `ensureQueryData` returns the cached data if fresh (or awaits the fetch); `prefetchQuery` is fire-and-forget and doesn't resolve the loader with data.
- **Same `staleTime` on server and client**. Different `queryOptions` (especially `staleTime`) between server and client cause hydration mismatches — the client immediately refetches what was just SSR'd.

## Pattern: loader + `useSuspenseQuery`

```tsx
export const Route = createFileRoute('/todos/$todoId')({
  loader: ({ context: { queryClient }, params: { todoId } }) =>
    queryClient.ensureQueryData(todoQueryOptions(todoId)),
  component: Todo,
})

function Todo() {
  const { todoId } = Route.useParams()
  // Same queryOptions on both sides — no hydration mismatch
  const { data } = useSuspenseQuery(todoQueryOptions(todoId))
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

## Related Notes

- [[Router Data Loading]] — loader + `ensureQueryData`
- [[Convex + TanStack Start — SSR & Loaders]] — Convex-specific SSR patterns
