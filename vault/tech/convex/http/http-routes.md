---
title: HTTP Routes & Webhooks
description: httpAction anatomy, convex/http.ts as mount point, webhook receiver patterns, error response mapping
type: tech
tags: [backend, convex, http, webhooks, actions]
created: 2026-04-27
updated: 2026-04-27
related: [[function-syntax]], [[convex-error-handling]], [[component-boundaries]], [[msw-setup]]
aliases: ["HTTP Routes & Webhooks"]
---

# HTTP Routes & Webhooks

> **Quick Summary**: `httpAction` handles inbound HTTP requests (webhooks, OAuth callbacks, REST endpoints). All routes mount in `convex/http.ts` via `HttpRouter`. `httpAction` has no `ctx.db` — read and write via `ctx.runQuery` / `ctx.runMutation`. Webhook handlers must verify signatures and be idempotent.

## `httpAction` anatomy

```ts
// convex/features/payments/webhooks.ts
import { httpAction } from '../../_generated/server';
import { internal } from '../../_generated/api';

export const handleStripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await request.text();
  const event = verifyStripeSignature(body, signature);  // throws on invalid
  if (!event) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Idempotency: skip if already processed
  const alreadyHandled = await ctx.runQuery(
    internal.features.payments.webhooks.isEventProcessed,
    { eventId: event.id },
  );
  if (alreadyHandled) return new Response(null, { status: 200 });

  // Delegate DB writes to an internal mutation (stays in one transaction)
  await ctx.runMutation(
    internal.features.payments.webhooks.processEvent,
    { eventId: event.id, type: event.type, data: event.data },
  );

  return new Response(null, { status: 200 });
});
```

**Rules:**
- No `ctx.db` — `httpAction` runs outside the database transaction model
- Use `ctx.runQuery` / `ctx.runMutation` to touch the DB
- Return a `Response` object — standard Web API

## `convex/http.ts` — the single mount point

All HTTP routes (app + component webhooks) mount here:

```ts
// convex/http.ts
import { httpRouter } from 'convex/server';
import { handleStripeWebhook } from './features/payments/webhooks';
import { resend } from './convex.config';   // component webhook

const http = httpRouter();

http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: handleStripeWebhook,
});

// Component webhooks mount at a path prefix
http.route({
  pathPrefix: '/webhooks/resend/',
  method: 'POST',
  handler: resend.handleResendEventWebhook(),
});

export default http;
```

Components cannot register their own routes — see [[component-boundaries]] for why.

## Webhook signature verification

Always verify before touching the database. Example with HMAC:

```ts
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(
  body: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  const actual = signatureHeader.replace('sha256=', '');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
```

Use `timingSafeEqual` — string comparison with `===` is vulnerable to timing attacks.

## Idempotency via `event.id`

Webhook providers retry on failure. Store processed event IDs to skip duplicates:

```ts
// internal query
export const isEventProcessed = internalQuery({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const row = await ctx.db
      .query('processed_webhook_events')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();
    return row !== null;
  },
});

// internal mutation — record + handle atomically
export const processEvent = internalMutation({
  args: { eventId: v.string(), type: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.insert('processed_webhook_events', { eventId: args.eventId });
    // ... handle event
  },
});
```

## Error response mapping

| `ConvexError` code | HTTP status | When |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Missing or invalid credentials |
| `FORBIDDEN` | 403 | Valid credentials, wrong permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION` | 400 | Malformed request body |
| `CONFLICT` | 409 | Duplicate / state conflict |
| `RATE_LIMITED` | 429 | Too many requests |

```ts
function convexErrorToResponse(err: unknown): Response {
  if (err instanceof ConvexError) {
    const { code } = err.data as { code: string };
    const statusMap: Record<string, number> = {
      UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
      VALIDATION: 400, CONFLICT: 409, RATE_LIMITED: 429,
    };
    return new Response(JSON.stringify(err.data), {
      status: statusMap[code] ?? 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('Internal server error', { status: 500 });
}
```

## Testing

- **Outbound HTTP calls** from `httpAction` or actions: mock with MSW (see [[msw-setup]])
- **Handler logic**: extract the core to an `internalMutation` and test that directly via `convex-test`; the `httpAction` wrapper is thin boilerplate
- **Signature verification**: unit-test the verification function in isolation with valid + tampered payloads

## Anti-patterns

> [!warning] ❌ Logic directly in `http.ts`
> `http.ts` is only a router. Put handler logic in `convex/features/*/webhooks.ts`.

> [!warning] ❌ Missing signature verification
> Any public endpoint without signature verification can be forged. Always verify before processing.

> [!warning] ❌ Using `ctx.db` inside `httpAction`
> `httpAction` runs outside the DB transaction model — there is no `ctx.db`. Use `ctx.runQuery` / `ctx.runMutation`.

> [!warning] ❌ Non-idempotent webhook handler
> Providers retry on timeouts. Without idempotency, a retry charges a customer twice, creates duplicate records, etc.

## See also

- [[function-syntax]] — `httpAction` is one of the four function flavors
- [[component-boundaries]] — why component webhooks mount in the app's `http.ts`
- [[convex-error-handling]] — error throw patterns used inside the handler's internal mutation
- [[msw-setup]] — mocking external API calls in tests
