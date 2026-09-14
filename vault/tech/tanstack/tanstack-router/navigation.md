---
tags: [frontend, tanstack, router, navigation, pitfalls]
related-skill: tanstack
aliases: ["Router Navigation"]
---

# Router Navigation — Pitfalls

> **Quick Summary**: The only rules worth keeping in the vault — generic API is reproducible from the docs.

## Pitfalls

- **Mutating search params directly** instead of using `navigate`/`Link` → history desyncs; state lives in the URL, treat it as read-only.
- **Imperative redirect in components** via `navigate` inside `useEffect` instead of `throw redirect({...})` in `beforeLoad`/`loader` → flash of protected content before the redirect fires.
- **Forgetting `preload="intent"`** on `<Link>` (or `defaultPreload: 'intent'` on the router) → slower perceived navigation, no prefetch on hover.

## Related Notes

- [[Router Data Loading]] — where redirects belong (`beforeLoad`)
- [[Router Type Safety]]
