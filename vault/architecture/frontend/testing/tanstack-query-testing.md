---
tags: [frontend, testing, tanstack-query, vitest]
related-skill: tanstack
aliases: ["TanStack Query Testing"]
---

# TanStack Query Testing

> **Quick Summary**: Each test gets its own `QueryClient` with `retry: false` and `gcTime: 0`. Wrap the component under test in a `QueryClientProvider`. Never share a `QueryClient` between tests — stale cache causes order-dependent failures.

## Setup

Same `vitest.config.ts` and `src/test.setup.ts` as TanStack Router Testing — see [[tanstack-router-testing]].

---

## Test wrapper

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}
```

Create the wrapper inside each test (or in `beforeEach`) so every test starts with a fresh cache.

---

## Query tests

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { vi } from 'vitest'

test('useQuery returns data on success', async () => {
  vi.mocked(fetchUser).mockResolvedValue({ id: '1', name: 'Alice' })

  const { result } = renderHook(
    () => useQuery({ queryKey: ['user', '1'], queryFn: () => fetchUser('1') }),
    { wrapper: makeWrapper() },
  )

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual({ id: '1', name: 'Alice' })
})

test('useQuery surfaces error state', async () => {
  vi.mocked(fetchUser).mockRejectedValue(new Error('Not found'))

  const { result } = renderHook(
    () => useQuery({ queryKey: ['user', '1'], queryFn: () => fetchUser('1') }),
    { wrapper: makeWrapper() },
  )

  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.error).toBeInstanceOf(Error)
})
```

---

## Mutation tests

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMutation } from '@tanstack/react-query'

test('useMutation calls the mutation fn and returns data', async () => {
  vi.mocked(createUser).mockResolvedValue({ id: '2', name: 'Bob' })

  const { result } = renderHook(
    () => useMutation({ mutationFn: createUser }),
    { wrapper: makeWrapper() },
  )

  await act(() => result.current.mutateAsync({ name: 'Bob' }))

  expect(result.current.isSuccess).toBe(true)
  expect(result.current.data).toEqual({ id: '2', name: 'Bob' })
})
```

---

## Optimistic update tests

Testing optimistic updates requires asserting *before* the mutation resolves:

```typescript
test('optimistic update shows immediately', async () => {
  let resolveCreate: (v: Item) => void
  vi.mocked(createItem).mockImplementation(
    () => new Promise(res => { resolveCreate = res }),
  )

  const { result } = renderHook(
    () => ({
      query: useQuery({ queryKey: ['items'], queryFn: fetchItems }),
      mutation: useMutation({
        mutationFn: createItem,
        onMutate: async (newItem) => {
          await queryClient.cancelQueries({ queryKey: ['items'] })
          const previous = queryClient.getQueryData(['items'])
          queryClient.setQueryData(['items'], (old: Item[]) => [...old, newItem])
          return { previous }
        },
        onError: (_err, _vars, ctx) => {
          queryClient.setQueryData(['items'], ctx?.previous)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
      }),
    }),
    { wrapper: makeWrapper() },
  )

  act(() => { result.current.mutation.mutate({ name: 'Optimistic Item' }) })

  // Visible before server confirms
  expect(result.current.query.data).toContainEqual({ name: 'Optimistic Item' })

  // Settle
  await act(() => { resolveCreate({ id: '10', name: 'Optimistic Item' }) })
})
```

---

## Convex queries (useConvexQuery / useSuspenseQuery)

When testing Convex-backed hooks through the TanStack Query adapter, prefer the pattern in [[backend-testing-fixtures]] for Convex unit tests (which run against a real in-memory DB). Use the TanStack wrapper approach only for pure UI-layer tests that mock the query function entirely.

```typescript
// UI-layer test — mock the Convex fetcher, not the DB
vi.mock('~/lib/convex', () => ({
  fetchItems: vi.fn(),
}))
```

---

## Anti-patterns

> [!warning] ❌ Sharing a `QueryClient` across tests — cached data bleeds between tests, causing false positives.

> [!warning] ❌ `retry: true` in test `QueryClient` — retries cause tests to time out on expected failures.

> [!warning] ❌ Not wrapping assertions in `waitFor` — queries are async; synchronous assertions fire before data lands.

> [!warning] ❌ Testing React Query internals (cache keys, observers) — assert on UI or hook output, not internal query state.

> [!tip] ✅ Use `renderHook` for hook-level tests, `render` for component-level tests. Don't mix — pick the right granularity.

---

## Related Notes

- [[tanstack-router-testing]] — combining router + query in a single test wrapper
- [[TanStack Mutations]] — optimistic update recipe (production pattern)
- [[Preload and Suspense Queries]] — SSR / Suspense pitfalls

## External

- [TanStack Query Testing Guide](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
