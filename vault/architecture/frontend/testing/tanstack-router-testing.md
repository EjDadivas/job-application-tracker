---
tags: [frontend, testing, tanstack-router, vitest]
related-skill: tanstack
aliases: ["TanStack Router Testing"]
---

# TanStack Router Testing

> **Quick Summary**: Router tests construct a full `router` instance with `createRouter` and mount it via `RouterProvider`. Each test owns its own `history` instance — create it in `beforeEach`, destroy it in `afterEach`. Never share router or history across tests.

## Setup

### Required packages

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
```

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test.setup.ts'],
  },
})
```

### `src/test.setup.ts`

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.resetAllMocks()
  window.history.replaceState(null, 'root', '/')
})
```

---

## Test anatomy

```typescript
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  RouterProvider,
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'

let history: RouterHistory

beforeEach(() => {
  history = createBrowserHistory()
  expect(window.location.pathname).toBe('/')  // sanity-check clean state
})

afterEach(() => {
  history.destroy()
  // global cleanup in test.setup.ts handles the rest
})
```

---

## Rendering a router in a test

```typescript
test('renders the index route', async () => {
  const rootRoute = createRootRoute({ component: Outlet })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <p>Index page</p>,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history,
  })

  await act(() => render(<RouterProvider router={router} />))

  expect(await screen.findByText('Index page')).toBeInTheDocument()
})
```

`act()` wraps the initial render so pending promises (route loader, etc.) flush before assertions.

---

## Common patterns

### Testing route params

```typescript
const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/detail/$id',
  params: {
    parse: (p) => z.object({ id: z.coerce.number() }).parse(p),
    stringify: (p) => ({ id: `${p.id}` }),
  },
  component: () => {
    const { id } = detailRoute.useParams()
    return <p>Detail page: {id}</p>
  },
})
```

### Testing navigation

```typescript
// Navigate programmatically after initial render
await act(() => router.navigate({ to: '/detail/$id', params: { id: 1 } }))
expect(await screen.findByText('Detail page: 1')).toBeInTheDocument()
```

### Testing redirects

```typescript
import { redirect } from '@tanstack/react-router'

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/protected',
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: '/login' })
  },
  component: () => <p>Protected</p>,
})

test('redirects unauthenticated users to login', async () => {
  vi.mocked(isAuthenticated).mockReturnValue(false)
  await act(() => render(<RouterProvider router={router} />))
  await act(() => router.navigate({ to: '/protected' }))
  expect(await screen.findByText('Login page')).toBeInTheDocument()
})
```

### Testing loader data

```typescript
const route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items',
  loader: async () => ({ items: await fetchItems() }),
  component: () => {
    const { items } = route.useLoaderData()
    return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
  },
})

test('renders loader data', async () => {
  vi.mocked(fetchItems).mockResolvedValue([{ id: '1', name: 'Widget' }])
  await act(() => render(<RouterProvider router={router} />))
  await act(() => router.navigate({ to: '/items' }))
  expect(await screen.findByText('Widget')).toBeInTheDocument()
})
```

---

## Anti-patterns

> [!warning] ❌ Sharing a `history` or `router` instance across tests — state leaks cause order-dependent failures.

> [!warning] ❌ Forgetting `await act(...)` around render — async route resolution won't flush; assertions will race.

> [!warning] ❌ Using `createMemoryHistory` when you don't need SSR — `createBrowserHistory` gives a real URL bar to assert against.

> [!warning] ❌ Testing `useNavigate` / `useParams` outside a `RouterProvider` — they throw without a router context.

> [!tip] ✅ Inline route definitions per test — keeps each test self-contained and routes obvious.

---

## Related Notes

- [[tanstack-query-testing]] — wrapping QueryClient in router tests
- [[Router Data Loading]] — loader patterns under test
- [[Router Navigation]] — navigation pitfalls to cover

## External

- [TanStack Router Testing Guide](https://tanstack.com/router/latest/docs/how-to/setup-testing)
