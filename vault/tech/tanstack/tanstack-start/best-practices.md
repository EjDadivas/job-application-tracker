---
tags: [frontend, tanstack, start, best-practices]
related-skill: tanstack
aliases: ["TanStack Start Best Practices"]
---

# TanStack Start Best Practices

> **Quick Summary**: Validate all server fn inputs, compose middleware for cross-cutting concerns, separate GET (cacheable data) from POST (mutations), do auth in `beforeLoad` + middleware (never components), and set `defaultPreload: 'intent'` for instant nav.

## Content

### Practices

1. **Use validators for all server function inputs** — runtime safety + TypeScript inference
2. **Compose middleware** for cross-cutting concerns (auth, logging, rate limiting)
3. **`createServerFn` GET** for data fetching (cacheable, preloadable from route loaders)
4. **`createServerFn` POST** for mutations and side effects
5. **`beforeLoad`** for route-level auth guards (not in components — flash risk)
6. **`defer()`** for non-critical data to improve TTFB
7. **`defaultPreload: 'intent'`** on the router for instant navigation
8. **Co-locate server functions** with the routes that use them

### Common Pitfalls

- Server functions cannot close over client-side variables — they're extracted to separate bundles
- Data returned from server functions must be serializable
- Forgetting `await` in loaders leads to streaming issues
- Importing server-only code in client bundles causes build errors
- Missing `declare module '@tanstack/react-router'` loses all type safety

## Related Notes

- [[TanStack Start Setup]] — framework setup
- [[TanStack Start Server Functions]] — GET vs POST
- [[TanStack Start Middleware]] — auth/logging chain
- [[Router Type Safety]] — the `declare module` block
- [[Router Navigation]] — `preload="intent"` on Links
