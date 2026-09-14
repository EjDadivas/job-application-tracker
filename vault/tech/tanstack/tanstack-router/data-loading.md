---
tags: [frontend, tanstack, router, data-loading, search-params]
related-skill: tanstack
aliases: ["Router Data Loading"]
---

# Router Data Loading

> **Quick Summary**: Route loaders fetch data before the component mounts — typed, cached, re-run on search-param changes via `loaderDeps`, and integrable with TanStack Query's `ensureQueryData`. Search params are validated with Zod or a custom validator, read via `Route.useSearch`, and updated via `navigate`/`Link` with search callbacks.

## Content

### Route Loaders

```tsx
export const Route = createFileRoute('/posts')({
  loader: async ({ context }) => {
    // Access router context (e.g., queryClient)
    const posts = await context.queryClient.ensureQueryData({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    })
    return { posts }
  },
  component: PostsComponent,
})

function PostsComponent() {
  const { posts } = Route.useLoaderData()
  // ...
}
```

### Loader Dependencies

Control when loaders re-execute:

```tsx
export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search: { page, filter } }) => ({ page, filter }),
  loader: async ({ deps: { page, filter } }) => {
    return fetchPosts({ page, filter })
  },
})
```

### Deferred Data Loading

Stream non-critical data:

```tsx
import { Await, defer } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const criticalData = await fetchCriticalData()
    const deferredData = defer(fetchSlowData())
    return { criticalData, deferredData }
  },
  component: DashboardComponent,
})

function DashboardComponent() {
  const { criticalData, deferredData } = Route.useLoaderData()

  return (
    <div>
      <CriticalSection data={criticalData} />
      <Suspense fallback={<Loading />}>
        <Await promise={deferredData}>
          {(data) => <SlowSection data={data} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

### Context-Based Data Loading

Provide shared dependencies via router context:

```tsx
// Create router with context
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // Will be provided by RouterProvider
  },
})

// In root/app component
function App() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

// In routes
export const Route = createFileRoute('/protected')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: '/login' })
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(userQueryOptions())
  },
})
```

### Search Param Validation

```tsx
import { z } from 'zod'

const postSearchSchema = z.object({
  page: z.number().default(1),
  filter: z.string().default(''),
  sort: z.enum(['date', 'title']).default('date'),
})

export const Route = createFileRoute('/posts')({
  validateSearch: postSearchSchema,
  // Or manual validation:
  // validateSearch: (search) => postSearchSchema.parse(search),
})
```

### Reading Search Params

```tsx
function PostsComponent() {
  // From route
  const { page, filter, sort } = Route.useSearch()

  // Or from any component with useSearch hook
  const search = useSearch({ from: '/posts' })
}
```

### Updating Search Params

```tsx
import { useNavigate } from '@tanstack/react-router'

function Pagination() {
  const navigate = useNavigate()
  const { page } = Route.useSearch()

  return (
    <button
      onClick={() =>
        navigate({
          search: (prev) => ({ ...prev, page: prev.page + 1 }),
        })
      }
    >
      Next Page
    </button>
  )
}

// Or via Link component
<Link to="/posts" search={(prev) => ({ ...prev, page: 2 })}>
  Page 2
</Link>
```

### Search Param Router Options

```tsx
const router = createRouter({
  routeTree,
  search: {
    strict: true, // Reject unknown params
  },
  stringifySearch: defaultStringifySearch,
  parseSearch: defaultParseSearch,
})
```

## Pitfalls

- Not using `loaderDeps` when the loader depends on search params → stale data after navigation within the route
- Using `useEffect` for data fetching instead of route loaders → double-fetch, waterfall
- Forgetting `await` in loaders → streaming issues, undefined data in component

## Related Notes

- [[Router Navigation]] — redirect (`throw redirect(...)`) pitfalls in `beforeLoad` / `loader`
- [[Router Type Safety]] — `declare module` + typed loader data
- [[Preload and Suspense Queries]] — loader + Suspense pitfalls
- [[Convex + TanStack Start — SSR & Loaders]] — Convex-specific loader patterns
