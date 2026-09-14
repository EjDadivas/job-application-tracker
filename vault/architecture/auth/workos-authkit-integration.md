---
title: WorkOS AuthKit + Convex + TanStack Start Integration
description: Full wiring for ConvexProviderWithAuth, the WorkOS auth adapter, SSR token injection, and callback route
type: tech
tags: [frontend, tanstack, start, convex, workos, auth, ssr]
created: 2026-04-24
updated: 2026-04-24
related: [[convex-tanstack-start-ssr]], [[TanStack Start Setup]], [[auth-overview]]
aliases: ["WorkOS AuthKit + Convex + TanStack Start Integration"]
---

# WorkOS AuthKit + Convex + TanStack Start Integration

> **Quick Summary**: Replace `ConvexProvider` with `ConvexProviderWithAuth` and bridge WorkOS's token API to Convex's `{ isLoading, isAuthenticated, fetchAccessToken }` interface via a `useAuthFromWorkOS` adapter hook. Inject the server-side token into `serverHttpClient` during SSR so authenticated Convex queries work server-rendered.

## Content

### `start.ts` — Register AuthKit middleware

```ts
// src/start.ts
import { createStart } from '@tanstack/react-start';
import { authkitMiddleware } from '@workos/authkit-tanstack-react-start';

export const startInstance = createStart(() => ({
  requestMiddleware: [authkitMiddleware()],
}));
```

`authkitMiddleware` reads and refreshes the WorkOS session cookie on every request. Without it, `getAuth()` returns no user on the server side.

---

### `router.tsx` — `ConvexProviderWithAuth` + `useAuthFromWorkOS` adapter

`ConvexProvider` has no auth capability — it can't attach JWTs to Convex requests. `ConvexProviderWithAuth` takes a custom `useAuth` hook that must return `{ isLoading, isAuthenticated, fetchAccessToken }`. The adapter below translates WorkOS's API into that shape.

```tsx
// src/router.tsx
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { AuthKitProvider, useAccessToken, useAuth } from '@workos/authkit-tanstack-react-start/client';
import { useCallback, useMemo } from 'react';

// In getRouter():
const router = createRouter({
  // ...
  context: { queryClient, convexClient: convex, convexQueryClient },
  Wrap: ({ children }) => (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convexQueryClient.convexClient} useAuth={useAuthFromWorkOS}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  ),
});

function useAuthFromWorkOS() {
  const { loading, user } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) return null;
      if (forceRefreshToken) return (await refresh()) ?? null;
      return (await getAccessToken()) ?? null;
    },
    [user, refresh, getAccessToken],
  );

  return useMemo(
    () => ({ isLoading: loading, isAuthenticated: !!user, fetchAccessToken }),
    [loading, user, fetchAccessToken],
  );
}
```

`AuthKitProvider` must wrap `ConvexProviderWithAuth` so that `useAuth` and `useAccessToken` have context available when the adapter hook runs.

---

### `__root.tsx` — SSR token injection

During SSR, Convex queries use HTTP (not WebSocket). Without explicit token injection, SSR'd queries run unauthenticated even when the user has a valid session cookie.

```ts
// src/routes/__root.tsx
const fetchWorkosAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = await getAuth();
  const { user } = auth;
  return {
    userId: user?.id ?? null,
    token: user ? auth.accessToken : null,
  };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  // ...
  beforeLoad: async (ctx) => {
    const { userId, token } = await fetchWorkosAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return { userId, token };
  },
});
```

`serverHttpClient` only exists during SSR — the optional chain (`?.`) guards against it being undefined on the client.

---

### `/callback` route — OAuth exchange

WorkOS redirects to `/callback` (or `/api/auth/callback`) after the user authenticates. `handleCallbackRoute()` exchanges the authorization code for a session cookie. No component is needed.

```ts
// src/routes/callback.tsx
import { createFileRoute } from '@tanstack/react-router';
import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/callback')({
  server: {
    handlers: {
      GET: handleCallbackRoute(),
    },
  },
});
```

The redirect URI must match what's registered in `convex.json` (e.g. `http://localhost:5173/callback`).

**With `onSuccess` hook** (for DB sync on first login):

```ts
GET: handleCallbackRoute({
  onSuccess: async ({ user, authenticationMethod }) => {
    await db.users.upsert({ id: user.id, email: user.email });
  },
  onError: ({ error }) => {
    return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 500 });
  },
}),
```

---

### Organization switching

```ts
// Server-side (in loader or server function)
import { switchToOrganization } from '@workos/authkit-tanstack-react-start';

const auth = await switchToOrganization({ data: { organizationId: 'org_456' } });
// Session now carries org_456's role, permissions, etc.

// Client-side (from useAuth hook)
const { switchToOrganization } = useAuth();
await switchToOrganization('org_456');
```

---

### Route loaders — `getAuth()` for SSR auth branching

Use `getAuth()` in route loaders when you need to branch on auth state during SSR (e.g., render sign-in buttons vs. a user menu server-side). Do not call it in components — components get auth state from `useAuth()` on the client.

```ts
// src/routes/index.tsx
import { getAuth, getSignInUrl, getSignUpUrl } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/')({
  loader: async () => {
    const { user } = await getAuth();
    const signInUrl = await getSignInUrl();
    const signUpUrl = await getSignUpUrl();
    return { user, signInUrl, signUpUrl };
  },
});
```

---

## Anti-patterns

> [!warning] ❌ Using `ConvexProvider` instead of `ConvexProviderWithAuth`
> `ConvexProvider` never attaches auth tokens — all Convex requests will be unauthenticated regardless of login state.

> [!warning] ❌ Skipping `authkitMiddleware` in `start.ts`
> `getAuth()` reads the session cookie via middleware. Without `authkitMiddleware`, it always returns no user on the server.

> [!warning] ❌ Omitting SSR token injection in `beforeLoad`
> Without `serverHttpClient.setAuth(token)`, SSR'd Convex queries run as anonymous even for logged-in users, causing a flash of unauthenticated content on hydration.

> [!warning] ❌ `createStart({ ... })` — passing options object directly
> `createStart` takes a **function** returning the options object: `createStart(() => ({ requestMiddleware: [...] }))`. Calling `createStart({ ... })` will fail at build time.

> [!warning] ❌ `default export` in `start.ts`
> The build plugin generates `import type { startInstance }` from `start.ts`. A `default` export causes a build error — use `export const startInstance = createStart(...)`.

> [!warning] ❌ Adding middleware to `createRouter()` in `router.tsx`
> `createRouter()` is TanStack Router (client-side only). Server middleware belongs in `start.ts` using `requestMiddleware`, not in the router.

> [!warning] ❌ Calling `getAuth()` in `beforeLoad`
> `beforeLoad` runs on the client during hydration. `getAuth()` is server-only. Move auth logic to `loader` instead — loaders are server-only during SSR. Use `useAuth()` for client components.

> [!warning] ❌ Not setting up the sign-in endpoint (`/api/auth/sign-in`)
> Dashboard impersonation flows redirect directly to the callback URL, bypassing PKCE setup. Without the sign-in endpoint configured in WorkOS Dashboard → Redirects, you get `"Missing required auth parameter"`. See the setup-project skill (`.claude/skills/setup-project/SKILL.md`) for the route pattern.

---

## See also

- the setup-project skill (`.claude/skills/setup-project/SKILL.md`) — `convex.json`, env vars, `auth.config.ts` customJwt format
- [[auth-overview]] — `ctx.auth.getUserIdentity()`, common gotchas
- [[convex-tanstack-start-ssr]] — `ensureQueryData`, `loaderDeps`
- [[TanStack Start Setup]] — base router wiring without auth
