---
title: WorkOS Widgets Token Strategies
description: Widget scope reference table, JS/TS token generation pattern, and elevated access token flow
type: tech
tags: [workos, widgets, auth, tokens]
created: 2026-04-24
updated: 2026-04-24
related: [[WorkOS AuthKit + Convex + TanStack Start Integration]], [[WorkOS RBAC Gotchas]]
source: devkit/raw/workos/plugins/workos/skills/workos-widgets/references/token-strategies.md
aliases: ["WorkOS Widgets Token Strategies"]
---

# WorkOS Widgets Token Strategies

## Widget Scope Reference

| Widget                             | Required Scope                       |
| ---------------------------------- | ------------------------------------ |
| `user-management`                  | `widgets:users-table:manage`         |
| `user-profile`                     | _(no permission scope required)_     |
| `admin-portal-sso-connection`      | `widgets:sso:manage`                 |
| `admin-portal-domain-verification` | `widgets:domain-verification:manage` |

## Token Generation (JS/TS with backend SDK)

Use when the app uses a backend WorkOS SDK (vs. `authkit-js` or `authkit-react` which use the existing access token).

```ts
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
  ...(process.env.WORKOS_BASE_API_URL && { host: process.env.WORKOS_BASE_API_URL }),
});

const authToken = await workos.widgets.getToken({
  userId: user.id,
  organizationId,
  scopes: ['widgets:users-table:manage'],
});
```

Widget tokens expire after **one hour**.

If token generation fails with authorization errors, check role permissions in WorkOS Dashboard — the user needs a role with the required widget permission. New WorkOS accounts start with an Admin role that already has widget permissions; existing accounts may need explicit updates.

## Elevated Access Tokens

Required for sensitive operations (check `fetching-apis.md` endpoint table for ⚠️ elevated marker before calling — not on failure).

1. `POST /_widgets/UserProfile/verify` → obtain elevated access token
2. Pass returned `elevatedAccessToken` in header `x-elevated-access-token`
3. Elevated tokens are **short-lived (10 minutes)** — scope usage to sensitive action paths only

## See also

- [[WorkOS AuthKit + Convex + TanStack Start Integration]] — token injection for SSR
- [[WorkOS RBAC Gotchas]] — role/permission setup for widget access
