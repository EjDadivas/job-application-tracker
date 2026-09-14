---
title: RBAC Helpers
description: Project auth contract — three-tier helper set in convex/shared/auth.ts, canonical usage, full signatures, and action-identity pattern
type: tech
tags: [backend, auth, rbac, convex, reference]
aliases: ["RBAC Helpers"]
---

# RBAC Helpers

`convex/shared/auth.ts` centralizes authentication and authorization. **This template ships one helper**: `requireAuth(ctx)`, which asserts "someone is signed in" and returns their identity. It throws a `ConvexError` carrying a stable `code` (B-12) on failure, so the handler body is always on the happy path.

Authorization — "is this signed-in person allowed to touch *this row*" — has no helper here, because it depends on what the row is. Fetch the row first, then compare its owner to the identity, and throw `{ code: 'forbidden' }` if they differ. A project that grows tenancy adds a `requireOrganizationAccess(ctx, orgId)` alongside `requireAuth` and calls them in that order; until then, do not write tests or docs that assume one exists.

> [!warning] Everything below this line is the **tenancy pattern**, not this template.
> `requireWorkspaceAccess`, `requireWorkspaceRole` and `getCurrentUser` are what a workspace-scoped
> project writes. **None of them exists in `convex/shared/auth.ts` today** — read `convex/shared/auth.ts`
> before citing any helper from this page, and never write a test that calls one.

## The three-tier helper set

```typescript
// convex/shared/auth.ts
export async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null>;
export async function requireAuth(ctx: QueryCtx): Promise<Doc<"users">>;
export async function requireWorkspaceAccess(
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
): Promise<Doc<"workspace_memberships">>;
export async function requireWorkspaceRole(
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
  roles: Array<"owner" | "admin" | "member" | "viewer">,
): Promise<Doc<"workspace_memberships">>;
```

| Helper | Asserts | Use when |
|---|---|---|
| `getCurrentUser` | nothing; returns null if unauth | pages that render for signed-out users too |
| `requireAuth` | signed-in | any protected read/write |
| `requireWorkspaceAccess` | member of that workspace | any resource-scoped read/write |
| `requireWorkspaceRole` | member with specific role | admin-only operations |

## Canonical usage pattern

Auth → resource fetch → authorize → return. Fetch the resource first to get its `workspaceId`, then authorize on that workspace — this catches cross-tenant access attempts.

```typescript
// queries.public.ts
export const getResource = query({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);                                   // 1. authenticated?
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) return null;                               // 2. exists?
    await requireWorkspaceAccess(ctx, resource.workspaceId); // 3. authorized?
    return resource;                                          // 4. respond
  },
});
```

For admin-only operations:
```typescript
await requireWorkspaceRole(ctx, workspaceId, ["owner", "admin"]);
```

`requireWorkspaceAccess` / `requireWorkspaceRole` return the membership doc — reuse it to read `.role` without an extra DB hit.

## Full signatures and error payloads

### `getCurrentUser(ctx)`

- Returns `Doc<"users"> | null`. Never throws.
- Use for pages that render for both signed-in and anonymous users.

### `requireAuth(ctx)`

Resolves `ctx.auth.getUserIdentity()` → `tokenIdentifier` → `users` row. Both a valid auth identity *and* an existing `users` doc are required.

| Condition | Error payload |
|---|---|
| No `ctx.auth` identity | `ConvexError({ code: 'UNAUTHENTICATED', message: 'Not authenticated' })` |
| Identity present but no matching `users` row | `ConvexError({ code: 'USER_NOT_FOUND', message: 'User not found', data: { subject } })` |

Returns `Doc<"users">` on success.

### `requireWorkspaceAccess(ctx, workspaceId)`

| Condition | Error payload |
|---|---|
| Unauthenticated | `ConvexError({ code: 'UNAUTHENTICATED', message: 'Not authenticated' })` |
| Authenticated but no membership | `ConvexError({ code: 'FORBIDDEN', message: 'Access denied', data: { workspaceId } })` |

Returns `Doc<"workspace_memberships">` on success.

### `requireWorkspaceRole(ctx, workspaceId, roles)`

Throws on top of `requireWorkspaceAccess`:

| Condition | Error payload |
|---|---|
| Role not in `roles` | `ConvexError({ code: 'FORBIDDEN', message: 'Insufficient permissions', data: { requiredRoles, actualRole } })` |

### Error `code` → frontend handling

| `code` | Frontend handling |
|---|---|
| `'UNAUTHENTICATED'` | Redirect to sign-in |
| `'USER_NOT_FOUND'` | Surface "account setup failed" |
| `'FORBIDDEN'` | 403 UI: "you don't have access to this" |
| `'NOT_FOUND'` | 404 UI (often indistinguishable from forbidden — by design) |

Test assertions:
```typescript
await expect(
  t.query(api.features.someResource.get, { resourceId }),
).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
```

## `ctx.auth` in actions

Actions can't read `ctx.auth` directly in all environments. Check identity via an internal query instead:

```typescript
export const syncFromExternal = action({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.features.auth.users.getCurrentUserOrThrow, {});
    // ...continue with external fetch + internal mutation.
  },
});
```

## Anti-patterns

> [!warning] ❌ `ctx.auth.getUserIdentity()` directly in feature code
> Calling `getUserIdentity()` in feature handlers means: (1) you get a raw `UserIdentity` instead of a typed `Doc<"users">`, (2) every handler re-implements the users table lookup, and (3) auth logic is scattered — a change to the user model (e.g. adding impersonation) requires a grep instead of a single-file edit.

> [!warning] ❌ `requireAuth` only, no workspace check
> Authenticated ≠ authorized. A user in workspace A can fetch workspace B's data.

> [!warning] ❌ Workspace check before resource fetch
> You need the resource's `workspaceId` first. Fetch, then authorize.

> [!warning] ❌ Auth checks inside internal functions
> Internals are called from already-authenticated contexts. Wastes work; blocks testability.

> [!tip] ✅ One file owns the auth contract (`convex/shared/auth.ts`)
> All auth helpers live here. Changing the auth model — e.g. adding impersonation via WorkOS's `switchToOrganization`, supporting service accounts, or tightening workspace roles — is a single-file change rather than a grep-and-edit across features.

## See also

- [[auth-overview]] — `ctx.auth.getUserIdentity()` basics and gotchas
- [[workos-authkit-sdk-reference]] — `useAuth`, `useAccessToken`, server `getAuth()` exports
- [[access-control-patterns]] — three tests every protected function needs
- [[convex-error-handling]] — frontend consumption of typed errors
- [[public-vs-internal-functions]] — why internals skip auth checks
