---
name: tanstack
description: Frontend patterns for TanStack Start + Convex. Use when adding a route or loader, fetching data with useSuspenseQuery, writing a mutation with an optimistic update, building UI with shadcn, debugging a hydration mismatch or a cache miss, or handling a route error.
---

# Frontend Dev Guidelines (TanStack)

Content for this skill lives in the Obsidian vault as atomic, wikilinked notes.

**Start here:** `vault/_index.md` (Frontend section)

**Key notes:**

- `vault/tech/tanstack/tanstack-router/data-loading.md`
- `vault/tech/tanstack/tanstack-router/navigation.md` — pitfalls only
- `vault/tech/tanstack/tanstack-router/type-safety.md` — pitfalls only
- `vault/tech/tanstack/tanstack-query/mutations.md` — optimistic update recipe
- `vault/tech/tanstack/tanstack-query/preload-and-suspense.md` — SSR / hydration pitfalls
- `vault/tech/tanstack/tanstack-start/setup.md`
- `vault/tech/tanstack/tanstack-start/server-functions.md`
- `vault/tech/tanstack/tanstack-start/middleware.md`
- `vault/tech/tanstack/tanstack-start/api-routes.md`
- `vault/tech/tanstack/tanstack-start/ssr.md`
- `vault/tech/tanstack/tanstack-start/deployment.md`
- `vault/tech/tanstack/tanstack-start/best-practices.md`
- `vault/architecture/frontend/convex-react-query-adapter.md`
- `vault/architecture/frontend/convex-tanstack-start-ssr.md`
- `vault/architecture/frontend/frontend-error-handling.md`
- `vault/architecture/frontend/toast-notifications.md`
- `vault/architecture/auth/workos-authkit-integration.md` — ConvexProviderWithAuth, SSR token injection, callback route; createStart gotchas
- `vault/architecture/frontend/workos-authkit-sdk-reference.md` — server + client exports for `@workos/authkit-tanstack-react-start`
- `vault/tech/workos/terms.md` — sealed session, redirect URI vs sign-in endpoint
- `vault/tech/workos/rbac.md` — permission check gotchas, membership ID requirement
- `vault/tech/workos/widgets-token-strategies.md` — widget scope table, elevated token flow
- `vault/architecture/backend/testing/msw-setup.md`
- `vault/tech/Frontend Anti-Patterns Index.md` — points to `vault/tech/tanstack/TanStack Anti-Patterns.md`, `vault/tech/workos/WorkOS Anti-Patterns.md`
- `vault/architecture/frontend/testing/tanstack-router-testing.md`
- `vault/architecture/frontend/testing/tanstack-query-testing.md`

**Rules:** `vault/_conventions.md` (F-01 … F-13, X-01, X-02)

**F-13 in particular** — a loader is not a once-per-session hook. This template ships
`defaultPreload: 'intent'`, so anything you put in a loader runs on hover. Lazy user provisioning
at the auth boundary is the usual way people trip on this.

Navigate from `_index.md` — do not read the whole vault.
