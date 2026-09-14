---
tags: [tanstack, frontend, anti-patterns, index]
related-skill: tanstack
---

# TanStack Anti-Patterns

## Router

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Mutating search params directly instead of `navigate`/`Link` | History desyncs | [[Router Navigation]] |
| Redirect via `navigate` inside `useEffect` | Flash of protected content | [[Router Navigation]] — `throw redirect(...)` in `beforeLoad` |
| Auth check in component instead of `beforeLoad` | Flash of protected content | [[Router Type Safety]] |
| Missing `loaderDeps` when loader uses search params | Stale data shown | [[Router Data Loading]] |
| `useEffect` for data fetching instead of route loader | Double-fetch, no SSR, waterfall | [[Router Data Loading]] |
| Forgetting `await` in loader | Streaming issues, undefined data | [[Router Data Loading]] |
| Missing `declare module '@tanstack/react-router'` | Everything collapses to `unknown` | [[Router Type Safety]] |
| Forgetting to regenerate `routeTree.gen.ts` after route changes | Stale route types | [[TanStack Start Setup]] |

## Query & Suspense

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `useSuspenseQuery` without a `<Suspense>` boundary | Thrown promise bubbles, breaks tree | [[Preload and Suspense Queries]] |
| `useSuspenseQuery` with `enabled: false` | Runtime error | [[Preload and Suspense Queries]] — use `useQuery` |
| `prefetchQuery` in route loaders | Fire-and-forget; data may not be ready | [[Preload and Suspense Queries]] — `ensureQueryData` |
| Different `staleTime` on server vs client | Hydration mismatch, immediate refetch | [[Preload and Suspense Queries]] |
| Mixing native Convex hooks and `convexQuery` in one component | Conflicting subscription models | [[Convex React Query Adapter]] |
| `queryClient.invalidateQueries` after a Convex mutation | Convex already reactive; redundant | [[Convex React Query Adapter]] |
| Omitting `ConvexProvider` because using `QueryClientProvider` | Standard Convex hooks need both | [[Convex React Query Adapter]] |
| Missing `loaderDeps` for URL-driven Convex queries | Stale cached result shown | [[Convex + TanStack Start — SSR & Loaders]] |
| `useQuery` instead of `useSuspenseQuery` for SSR data | Ships HTML without content | [[TanStack Start Setup]] |

## Mutations

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| No `isPending` handling | Double-click fires twice | [[TanStack Mutations]] |
| Updating local state from mutation response | Convex auto-reconciles; state diverges | [[TanStack Mutations]] — let query update |
| Replacing button with spinner | Breaks focus trap | [[TanStack Mutations]] — use `disabled` + `aria-busy` |

## TanStack Start & SSR

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Server function closes over client-side variable | Extracted to separate bundle; runtime crash | [[TanStack Start Server Functions]] |
| Server function returns non-serializable data (class, function, symbol) | Runtime serialization error | [[TanStack Start Server Functions]] |
| Server-only import in client bundle | Build error | [[TanStack Start Best Practices]] |
| Deferring SEO-critical data (meta, title, canonical) | Not server-rendered; CLS risk | [[TanStack Start SSR]] |
| `createStart({ ... })` passing options object directly | Must pass a function returning options | [[WorkOS AuthKit + Convex + TanStack Start Integration]] |
| `default export` in `start.ts` | Build plugin needs named `export const startInstance` | [[WorkOS AuthKit + Convex + TanStack Start Integration]] |
| Middleware added to `createRouter()` in `router.tsx` | Server middleware belongs in `start.ts` | [[WorkOS AuthKit + Convex + TanStack Start Integration]] |

## Auth integration (Convex + WorkOS)

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `ConvexProvider` instead of `ConvexProviderWithAuth` | All requests unauthenticated regardless of login | [[WorkOS AuthKit + Convex + TanStack Start Integration]] |
| Skipping `authkitMiddleware` in `start.ts` | `getAuth()` always returns no user on server | [[WorkOS AuthKit + Convex + TanStack Start Integration]] |
| Omitting SSR token injection in loader's `beforeLoad` | SSR Convex queries run anonymous; flash of unauthed content | [[WorkOS AuthKit + Convex + TanStack Start Integration]] |
| Calling `getAuth()` in `beforeLoad` | Server-only; breaks on client hydration | [[WorkOS AuthKit + Convex + TanStack Start Integration]] — use `loader` |
| Not setting up `/api/auth/sign-in` endpoint | Dashboard impersonation causes missing auth param | [[WorkOS AuthKit + Convex + TanStack Start Integration]] |

## Error handling & toasts

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `error.message` for display | Shows internal JSON wrapper | [[Frontend Error Handling]] — read `error.data` |
| `toast.error(error.message)` | Shows raw `ConvexError: {"type":"NOT_FOUND",...}` | [[Toast Notifications]] — read `error.data` |
| One generic toast for all `ConvexError`s | Loses all typed backend info | [[Frontend Error Handling]] |
| Toast fired in a shared utility called from many places | Multiple callers = duplicate toasts | [[Toast Notifications]] |
| `toast.promise()` when you need to read the result | Fire-and-forget; can't access resolved value | [[Toast Notifications]] |
| `errorComponent` for not-found | Wrong error boundary type | [[Router Navigation]] — use `notFoundComponent` |
| Leaking server error messages to UI | Exposes internals | [[Frontend Error Handling]] |

## Forms

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Validator returning object instead of string | TanStack Form shows no error | Form Handling with TanStack Form (upstream tanstack-skills) |
| Missing `field.handleBlur` | Validation never triggers on blur | Form Handling with TanStack Form (upstream tanstack-skills) |

## Testing

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Sharing `QueryClient` across tests | Cached data bleeds; false positives | [[TanStack Query Testing]] — new client per test |
| `retry: true` in test `QueryClient` | Tests time out on expected failures | [[TanStack Query Testing]] — `retry: false` |
| Not wrapping assertions in `waitFor` | Fires before data lands | [[TanStack Query Testing]] |
| Sharing `history`/`router` instance across tests | State leaks; order-dependent failures | [[TanStack Router Testing]] |
| Forgetting `await act(...)` around render | Async route resolution won't flush | [[TanStack Router Testing]] |
| `useNavigate`/`useParams` outside `RouterProvider` | Throws without router context | [[TanStack Router Testing]] |

## Styling

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Dynamic Tailwind class `bg-${color}-500` | Class purged at build time | Use full class strings or `cn()` with a safelist |
| Inline `style={{...}}` for Tailwind-covered props | Bypasses design tokens | Use Tailwind utilities |
| Hand-rolling `<button>` when `<Button>` exists | Inconsistent styles and a11y | Use shadcn/ui `<Button>` |
