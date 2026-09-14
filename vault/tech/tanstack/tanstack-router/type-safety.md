---
tags: [frontend, tanstack, router, typescript, pitfalls]
related-skill: tanstack
aliases: ["Router Type Safety"]
---

# Router Type Safety — Pitfalls

> **Quick Summary**: One `declare module` unlocks inference for the whole router surface. Without it everything collapses to `unknown`. Auth belongs in `beforeLoad`, not components.

## The one thing you must do

```tsx
declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
```

Without this block every `useParams`, `useSearch`, `useLoaderData`, `<Link to=...>`, and `navigate` call falls back to `unknown`.

## Best practice worth keeping

**Do auth in `beforeLoad`, not in components.** A component-level guard (conditional render, `useEffect` redirect) ships the protected markup to the client first and then flashes. `beforeLoad` runs before the route renders, so `throw redirect({ to: '/login' })` from there prevents the flash entirely.

## Pitfalls

- **Forgetting `declare module`** → no type inference.
- **Missing `loaderDeps`** when the loader depends on search params → the loader doesn't re-run on param change and you serve stale data.
- **Auth in components** → flash of protected content. Use `beforeLoad`.
- **Using `useEffect` for data fetching** → skip the loader, lose SSR + prefetch.

## Related Notes

- [[Router Data Loading]] — `loader`, `loaderDeps`, `beforeLoad`
- [[Router Navigation]] — navigation pitfalls
