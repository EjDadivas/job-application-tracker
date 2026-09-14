---
tags: [frontend, tanstack, start, api-routes, rest]
related-skill: tanstack
aliases: ["TanStack Start API Routes"]
---

# TanStack Start API Routes

> **Quick Summary**: `createAPIFileRoute('/api/…')` defines a REST-style handler per HTTP method. Use these for webhooks, third-party integrations, or any endpoint that needs to be reachable from outside the app. For internal client→server calls, prefer `createServerFn` (typed RPC, no URL).

## Content

```typescript
// app/routes/api/users.ts
import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/users')({
  GET: async ({ request }) => {
    const users = await db.query.users.findMany()
    return Response.json(users)
  },
  POST: async ({ request }) => {
    const body = await request.json()
    const user = await db.insert(users).values(body).returning()
    return new Response(JSON.stringify(user), { status: 201 })
  },
})
```

### API route vs server function

| Use case | Pick |
|---|---|
| Internal, called from React with types | [[TanStack Start Server Functions]] |
| Webhook from Stripe/GitHub/etc. | API route |
| Mobile/native client hitting same backend | API route |
| Public REST endpoint | API route |

## Error handling

Standard pattern: validate → auth → process in try-catch. Return proper HTTP status codes. Never expose internal error details to clients; log them server-side.

```ts
export const APIRoute = createAPIFileRoute('/api/oauth/callback')({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
      const result = await processOAuth(code);
      return Response.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      console.error('OAuth callback error:', error);
      return new Response(
        JSON.stringify({ error: 'OAuth process failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  },
});
```

### Status codes

| Code | When |
|---|---|
| 400 | Missing/invalid request params |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource doesn't exist |
| 409 | Conflict (e.g. already exists) |
| 429 | Rate-limited |
| 500 | Unexpected — always accompanied by server-side log |

```ts
// ❌ Leaks internals to clients
return new Response(JSON.stringify({ error: error.stack }), { status: 500 });

// ✅ Generic message to client; full details to server log
console.error('OAuth callback error:', error);
return new Response(JSON.stringify({ error: 'OAuth process failed' }), { status: 500 });
```

## Related Notes

- [[TanStack Start Server Functions]] — when RPC beats REST
- [[TanStack Start Setup]] — where `api/` lives under `app/routes/`
- [[ConvexError Handling]] — server-side errors in Convex functions
