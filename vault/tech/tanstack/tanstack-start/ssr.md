---
tags: [frontend, tanstack, start, ssr, streaming]
related-skill: tanstack
aliases: ["TanStack Start SSR"]
---

# TanStack Start SSR

> **Quick Summary**: Streaming SSR is the default: a route's loader can await critical data and `defer()` slow data. The component unwraps deferred promises with `<Await>` inside a `<Suspense>` boundary, so the HTML streams as each chunk resolves. This is the same pattern as Router's deferred loading, just running on the server.

## Content

### Streaming SSR (default)

```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async () => ({
    criticalData: await fetchCriticalData(),
    deferredData: defer(fetchSlowData()),
  }),
  component: Dashboard,
})

function Dashboard() {
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

### When to `defer`

- Analytics, recommendations, "you might also like" panels
- Anything the above-the-fold experience doesn't need
- Third-party APIs with variable latency

### When NOT to `defer`

- Data needed for SEO (meta, title, canonical)
- Anything that affects the initial layout (CLS risk)
- Auth state — that belongs in `beforeLoad`

## Related Notes

- [[Router Data Loading]] — `defer` / `Await` live in the router layer
- [[TanStack Start Setup]] — framework setup + where streaming SSR fits
- [[Preload and Suspense Queries]] — combining TanStack Query's suspense hooks with SSR
