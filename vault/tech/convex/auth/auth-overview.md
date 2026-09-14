---
tags: [convex, auth, security, anti-patterns]
related-skill: convex
source: devkit/raw/convex/skills/convex-setup-auth
aliases: ["Auth Overview"]
---

# Auth Overview

Project uses **WorkOS AuthKit**. See `/setup-tanstack-convex-authkit` command for provider wiring.

## Never trust client-supplied userId

Always verify identity server-side with `ctx.auth.getUserIdentity()`.

```ts
// Bad: trusts client-supplied userId
export const getMyProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
```

```ts
// Good: verify server-side
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});
```

## Common Gotchas

- **Login ≠ Convex session**: A provider login succeeding does not mean Convex received the session. Always verify with `useAuth()` from `@workos/authkit-tanstack-react-start/client` (client) or `ctx.auth.getUserIdentity()` (server) — these are the authoritative auth signals.
- **Dev vs production**: Dev and production deployments require separate credentials and issuer domains. Never reuse dev keys in production.
- **Redeploy after `auth.config.ts` changes**: After editing `convex/auth.config.ts`, run `npx convex dev` (or deploy) so the backend picks up the new config.

## Error Messages

- `"Not authenticated"` — no identity found
- `"Unauthorized"` — identity found but lacks permission

## See Also

- [[workos-authkit-sdk-reference]] — server + client SDK exports
- [[WorkOS AuthKit + Convex + TanStack Start Integration]] — provider wiring
