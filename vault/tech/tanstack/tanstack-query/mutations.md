---
tags: [frontend, tanstack, query, mutations, optimistic]
related-skill: tanstack
aliases: ["TanStack Mutations"]
---

# TanStack Mutations — Optimistic Update Recipe

> **Quick Summary**: Optimistic updates follow 4 steps: cancel → snapshot → set → rollback. Always invalidate (or refetch) after the mutation settles, even when the optimistic update already applied.

## The 4-step pattern

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (next) => {
    // 1. Cancel in-flight refetches so they don't stomp our optimistic write
    await queryClient.cancelQueries({ queryKey: ['todos', next.id] })

    // 2. Snapshot for rollback
    const previous = queryClient.getQueryData(['todos', next.id])

    // 3. Optimistic set
    queryClient.setQueryData(['todos', next.id], next)

    // 4. Return context for onError
    return { previous }
  },
  onError: (_err, next, ctx) => {
    queryClient.setQueryData(['todos', next.id], ctx.previous)
  },
  onSettled: () => {
    // Always invalidate — the server is the source of truth
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

For lists, the shape is the same — snapshot the list, `setQueryData(key, old => [...old, next])`, roll back on error.

## Rules

- **Cancel queries in `onMutate`** before the optimistic set, or an in-flight refetch may overwrite it.
- **Return context from `onMutate`** so `onError` can roll back cleanly.
- **Always invalidate in `onSettled`** — optimistic success doesn't guarantee server state matches.

## Related Notes

- [[TanStack Start Server Functions]] — POST server fns as `mutationFn`
- [[Preload and Suspense Queries]]
