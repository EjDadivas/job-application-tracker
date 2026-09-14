---
title: Convex Resend Component
description: @convex-dev/resend — workpool-backed durable email delivery, testMode gotcha, webhook handler setup
type: tech
tags: [convex, resend, email, components, webhooks]
created: 2026-04-25
updated: 2026-04-25
related: [[tech/resend/overview]], [[sdk-patterns]]
source: https://www.convex.dev/components/resend
---

# Convex Resend Component (`@convex-dev/resend`)

The official Convex component for Resend. Instead of calling the Resend API directly from actions, this wraps delivery in Convex workpools — giving you durable queuing, automatic batching, built-in retry, and idempotency key management for free.

## Installation & setup

```bash
npm install @convex-dev/resend
```

`convex/convex.config.ts`:
```typescript
import { defineApp } from 'convex/server';
import resend from '@convex-dev/resend/convex.config';

const app = defineApp();
app.use(resend);
export default app;
```

## Sending emails

```typescript
import { components } from './_generated/api';
import { Resend } from '@convex-dev/resend';

const resend = new Resend(components.resend, {
  testMode: false, // see gotcha below
});

// Inside a mutation or action:
await resend.sendEmail(ctx, {
  from: 'Acme <noreply@...>',
  to: [inviteeEmail],
  subject: 'You have been invited',
  react: <InvitationEmail name={name} ctaUrl={ctaUrl} />,
});
```

## Critical gotcha: testMode defaults to true

`testMode: true` is the default. In test mode the component **does not send emails** to Resend — it silently no-ops. Must explicitly set `testMode: false` in production config.

```typescript
const resend = new Resend(components.resend, {
  testMode: process.env.NODE_ENV !== 'production', // or just false
});
```

## Webhook handler

Mount in `convex/http.ts` to receive delivery events (bounced, delivered, opened, etc.):

```typescript
import { httpRouter } from 'convex/server';
import { resend } from './resend'; // your Resend instance

const http = httpRouter();

http.route({
  path: '/resend-webhook',
  method: 'POST',
  handler: resend.handleResendEventWebhook(),
});

export default http;
```

Set `RESEND_WEBHOOK_SECRET` in your Convex env vars for signature verification. Register an `onEmailEvent` callback in the `Resend` options to handle status changes in your Convex database.

## Other APIs

```typescript
// Check delivery status
const status = await resend.status(ctx, emailId);

// Cancel a queued email before it's sent to Resend
await resend.cancelEmail(ctx, emailId);
```

## How it differs from calling Resend directly

| | Direct Resend SDK | `@convex-dev/resend` component |
|---|---|---|
| Retry on failure | Manual | Automatic (Convex workpool) |
| Idempotency keys | Manual | Automatic |
| Batching | Manual | Automatic |
| Durable execution | No | Yes (survives restarts) |
| testMode guard | No | Yes (default on) |

## See also

- [[tech/resend/overview]] — project email architecture, template locations, scheduler decision
- [[sdk-patterns]] — raw Resend SDK gotchas (for any direct API calls)
