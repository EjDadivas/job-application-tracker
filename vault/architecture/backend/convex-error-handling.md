---
tags: [backend, frontend, errors, convex]
related-skill: error-tracking
aliases: ["ConvexError Handling"]
---

# ConvexError Handling

> **Quick Summary**: Throw `ConvexError` from Convex functions with a typed payload; the client catches via `instanceof ConvexError` and reads `error.data`. Always auth → validate → fetch → authorize → act (order matters).

## Throw order in a mutation

```ts
import { mutation } from '@/convex/_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

export const updateClient = mutation({
  args: { clientId: v.id('clients'), name: v.string() },
  handler: async (ctx, args) => {
    // 1. Authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: 'UNAUTHENTICATED', message: 'Not authenticated' });

    // 2. Validation
    if (args.name.trim().length === 0) {
      throw new ConvexError({
        code: 'VALIDATION',
        message: 'Client name cannot be empty',
        data: { field: 'name' },
      });
    }

    // 3. Fetch
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Client not found',
        data: { resource: 'Client', id: args.clientId },
      });
    }

    // 4. Authorization (on the fetched resource)
    const hasAccess = await checkOrgAccess(ctx, client.organizationId, identity.subject);
    if (!hasAccess) {
      throw new ConvexError({
        code: 'PERMISSION_DENIED',
        message: "You don't have permission to edit this client",
      });
    }

    // 5. Act
    await ctx.db.patch(args.clientId, { name: args.name });
    return { success: true };
  },
});
```

## Query pattern

Same order, minus the final mutation step. Queries throw `ConvexError` for not-found / permission-denied just like mutations.

## Action pattern (external APIs)

Actions can't touch `ctx.db` — fetch via `ctx.runQuery(internal.*)`, then call external APIs in try-catch. Map HTTP status codes to typed `ConvexError` payloads:

```ts
try {
  const response = await fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${integration.accessToken}` },
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new ConvexError({ code: 'AUTH_EXPIRED', message: 'Token expired' });
    }
    if (response.status === 429) {
      throw new ConvexError({ code: 'RATE_LIMITED', message: 'Rate limit exceeded. Try again later.', data: { retryAfter: 60 } });
    }
    throw new ConvexError(`API error: ${response.status}`);
  }
  // ...
} catch (error) {
  if (error instanceof ConvexError) throw error; // re-throw typed
  console.error('Sync error:', error);
  throw new ConvexError('Failed to sync. Please try again.');
}
```

## Client catch pattern

```tsx
import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

const createClient = useMutation(api.features.clients.create);

try {
  await createClient({ name: 'New Client' });
  // success toast
} catch (error) {
  if (error instanceof ConvexError) {
    // typed — dispatch on error.data
    handleConvexError(error);
  } else {
    // unexpected — log + generic toast
    console.error('Unexpected error:', error);
  }
}
```

See [[frontend-error-handling]] for the `handleConvexError` dispatcher.

## Anti-patterns

> [!warning] ❌ Authorizing before fetching
> ```ts
> const hasAccess = await checkAccess(ctx, args.clientId);
> if (!hasAccess) throw new ConvexError('PERMISSION_DENIED');
> const client = await ctx.db.get(args.clientId); // what if it doesn't exist?
> ```

> [!tip] ✅ Fetch first, then authorize on the resource
> ```ts
> const client = await ctx.db.get(args.clientId);
> if (!client) throw new ConvexError({ code: 'NOT_FOUND', message: 'Client not found' });
> const hasAccess = await checkAccess(ctx, client.organizationId);
> if (!hasAccess) throw new ConvexError({ code: 'PERMISSION_DENIED', message: 'Access denied' });
> ```

> [!warning] ❌ Throwing raw `Error` or string
> ```ts
> throw 'Not allowed'; // client can't type-narrow this
> ```

> [!tip] ✅ Always `new ConvexError(payload)`
> Payload is `string` for simple messages or an object for typed dispatch.

## See also

- [[frontend-error-handling]] — client-side dispatcher
- [[RBAC Helpers]] — auth + authz helpers used above
