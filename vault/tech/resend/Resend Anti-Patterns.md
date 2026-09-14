---
tags: [resend, anti-patterns, index]
related-skill: resend
---

# Resend Anti-Patterns

## SDK patterns

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `try/catch` for Resend API errors | SDK never throws; errors come in `{ data, error }` | [[Resend SDK Patterns]] |
| No idempotency key when sending from Convex | Convex retries → duplicate sends | [[Resend SDK Patterns]] |
| Same idempotency key with different payload | 409 error | [[Resend SDK Patterns]] — key must be unique per logical send |
| Testing with fake addresses at real providers (`test@gmail.com`) | Bounces harm sender reputation | [[Resend SDK Patterns]] — use Resend test addresses |
| One invalid address in a batch send | Entire batch fails | [[Resend SDK Patterns]] — validate before batching |
| Continuing to send after hard bounce (`email.bounced`) | Permanent reputation damage | [[Resend SDK Patterns]] — remove address immediately |
| `testMode` not explicitly set to `false` in production | Default for `@convex-dev/resend` is `true`; silently no-ops all sends | [[resend-component]] |

## React Email

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `rem` units in styles | Not supported in email clients | [[React Email]] — use `pixelBasedPreset` |
| Flexbox or Grid for layout | Not supported | [[React Email]] — use `<Row>`/`<Column>` or tables |
| SVG or WEBP images | Not supported in email clients | [[React Email]] — use PNG or JPEG |
| `border` without `border-solid` | Broken in many clients | [[React Email]] — always include `border-solid` |
| `<Head />` outside `<Tailwind>` | Styles not applied | [[React Email]] — `<Head />` must be inside `<Tailwind>` |
| `<Preview>` not first element inside `<Body>` | Preview text wrong or missing | [[React Email]] |
| `{{mustache}}` syntax directly in JSX | Runtime JSX error | [[React Email]] — use only in `PreviewProps` |
| Email template > 102KB | Gmail clips the email | [[React Email]] — keep under limit |

## Webhooks & config

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| `req.json()` for webhook body | JSON parsing destroys signature | [[Resend SDK Patterns]] — use `req.text()` |
| Non-200 response for unhandled events | Resend retries indefinitely | [[Resend SDK Patterns]] — return 200 for all event types |
| Not storing `signing_secret` immediately on webhook creation | Shown only once; unrecoverable | [[Resend SDK Patterns]] — store as `RESEND_WEBHOOK_SECRET` |
| `.delete()` in Node.js SDK to remove webhook | Wrong method | [[Resend SDK Patterns]] — use `.remove()` |
