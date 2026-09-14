---
title: WorkOS AuthKit SDK Reference
description: Server and client export reference for @workos/authkit-tanstack-react-start
type: tech
tags: [workos, auth, tanstack-start, sdk-reference]
---

# WorkOS AuthKit SDK Reference

Quick export reference for `@workos/authkit-tanstack-react-start`.

## Server (main package)

- `authkitMiddleware(options?)` — request middleware (goes in `start.ts`); accepts `{ redirectUri }` to override `WORKOS_REDIRECT_URI` (useful for Vercel preview deployments)
- `handleCallbackRoute(options?)` — OAuth callback handler; accepts `{ onSuccess, onError }` hooks for DB sync
- `getAuth()` — get current session; returns `{ user, organizationId, role, permissions, accessToken, ... }`
- `signOut({ data: { returnTo } }?)` — sign out user
- `getSignInUrl()` / `getSignUpUrl()` — auth URLs
- `switchToOrganization({ data: { organizationId } })` — switch active org context server-side

## Client (`/client` subpath)

```ts
import {
  useAuth,
  useAccessToken,
  useTokenClaims,
  AuthKitProvider,
} from "@workos/authkit-tanstack-react-start/client";
```

- `AuthKitProvider` — context provider (required if using client hooks)
- `useAuth()` — reactive auth state + `signOut()`, `switchToOrganization(orgId)`, `getAuth()`
- `useAccessToken()` — `{ accessToken, getAccessToken(), refresh() }` — `getAccessToken()` always returns a fresh token
- `useTokenClaims()` — parsed JWT claims (`{ sid, org_id, role, ... }`)

## See also

- [[workos-authkit-integration]] — `ConvexProviderWithAuth`, SSR token injection, callback route
- [[auth-overview]] — server-side identity verification with `ctx.auth.getUserIdentity()`
