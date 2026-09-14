---
title: Resend SDK Patterns & Gotchas
description: Non-obvious Resend SDK gotchas — no-throw pattern, idempotency keys, error dispatch, testing addresses, webhook verification, batch limits
type: tech
tags: [resend, email, sdk, webhooks, gotchas]

aliases: ["Resend SDK Patterns"]
---

# Resend SDK Patterns & Gotchas

## No-throw pattern (critical)

The Node.js SDK **never throws**. It returns `{ data, error }`. Don't wrap in try/catch for API errors.

```typescript
const { data, error } = await resend.emails.send({ ... });

if (error) {
  // handle error
  return;
}
console.log('Sent:', data.id);
```

## Idempotency keys

Always include an idempotency key when sending from Convex actions — Convex may retry on failure.

| Fact | Value |
|------|-------|
| Format (single) | `<event-type>/<entity-id>` |
| Format (batch) | `batch-<event-type>/<batch-id>` |
| Expiration | 24 hours |
| Max length | 256 characters |
| Same key + same payload | Returns original response, no duplicate send |
| Same key + different payload | **409 error** |

```typescript
const { data, error } = await resend.emails.send(
  { from: '...', to: ['...'], subject: '...', react: <Template /> },
  { idempotencyKey: `project-invitation/${invitationId}` }
);
```

## Error dispatch

| Code | Named error | Action |
|------|-------------|--------|
| 400 | `validation_error` | Fix request — don't retry |
| 401 | `authentication_error` | Check `RESEND_API_KEY` — don't retry |
| 403 | `authorization_error` | See 403 gotchas below — don't retry |
| 409 | `invalid_idempotent_request` | Use new key or fix payload — don't retry |
| 422 | `unprocessable_entity` | Fix content — don't retry |
| 429 | `rate_limit_exceeded` | Retry with exponential backoff (default: 2 req/s) |
| 500 | `api_error` | Retry with exponential backoff |

## 403 gotchas

| Cause | Fix |
|-------|-----|
| Using `onboarding@resend.dev` | Sandbox — only delivers to your Resend account email. Verify your own domain. |
| `from` domain mismatch | The `from` address domain must **exactly** match a verified domain. `send.acme.com` ≠ `acme.com`. |
| Unverified domain | Verify at resend.com/domains first |
| `restricted_api_key` (401) | A sending-only key used on a non-sending endpoint — create a full-access key |

## Batch limitations

| Limit | Value |
|-------|-------|
| Max per batch | 100 emails |
| Atomicity | One invalid email fails the **entire** batch |
| Attachments | **Not supported** — use single sends |
| `scheduled_at` | **Not supported** — use single sends |

Always validate all emails before sending a batch.

## Testing addresses

Never test with fake addresses at real providers (`test@gmail.com`) — they bounce and harm sender reputation.

| Address | Simulates |
|---------|-----------|
| `delivered@resend.dev` | Successful delivery |
| `bounced@resend.dev` | Hard bounce |
| `complained@resend.dev` | Spam complaint |

## Webhook verification

### Raw body required

Must use `req.text()` — **not** `req.json()`. JSON parsing destroys the signature.

```typescript
export async function POST(req: Request) {
  const payload = await req.text(); // NOT req.json()

  const event = resend.webhooks.verify({
    payload,
    headers: {
      'svix-id': req.headers.get('svix-id'),
      'svix-timestamp': req.headers.get('svix-timestamp'),
      'svix-signature': req.headers.get('svix-signature'),
    },
    secret: process.env.RESEND_WEBHOOK_SECRET,
  });

  if (event.type === 'email.bounced') {
    // hard bounce — remove address from all future sends
  }

  if (event.type === 'email.received') {
    // payload has NO body — must fetch separately
    const { data: email } = await resend.emails.receiving.get(event.data.email_id);
  }

  return new Response('OK', { status: 200 });
}
```

### Webhook event types

| Event | Trigger |
|-------|---------|
| `email.sent` | API request accepted |
| `email.delivered` | Reached recipient's mail server |
| `email.bounced` | Hard bounce — permanent failure |
| `email.complained` | Marked as spam |
| `email.opened` / `email.clicked` | Engagement tracking |
| `email.delivery_delayed` | Soft bounce — Resend retries automatically |
| `email.received` | Inbound email arrived |

**Bounce handling:** Hard bounce (`email.bounced`) = remove address immediately, never retry. Soft bounce (`email.delivery_delayed`) = Resend retries automatically.

### Webhook retry schedule

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 5 hours |
| 7 | 10 hours |

Always return HTTP 200 quickly, then process asynchronously.

### Webhook gotchas

- `signing_secret` is **only returned on CREATE** — not on GET. Store it as `RESEND_WEBHOOK_SECRET` immediately.
- Use `.remove()` not `.delete()` in the Node.js SDK to delete a webhook.
- Return 200 even for events you don't handle — otherwise Resend will retry indefinitely.

## See also

- [[tech/resend/overview]] — project email architecture, scheduler decision, template locations
- [[react-email]] — React Email template constraints
