---
title: WorkOS Events & Webhooks Gotchas
description: Non-obvious traps for WorkOS webhooks and Events API — deduplication, signature verification, polling state
type: tech
tags: [workos, webhooks, events, backend]
created: 2026-04-24
updated: 2026-04-24
related: [[workos-authkit-integration]]
source: devkit/raw/workos/plugins/workos/skills/workos/references/workos-events.md
aliases: ["WorkOS Events & Webhooks Gotchas"]
---

# WorkOS Events & Webhooks Gotchas

Docs:
- https://workos.com/docs/events/data-syncing/webhooks
- https://workos.com/docs/events/data-syncing/events-api

## Gotchas

- **Do not implement both webhooks and Events API polling simultaneously** — causes duplicate event processing.
- **Webhook endpoints must return 200 OK within 5 seconds.** Acknowledge immediately, process asynchronously.
- **Verify webhook signature before processing using the raw request body.** JSON-parsing the body before verification breaks the signature check.
- **`WORKOS_WEBHOOK_SECRET` is shown only once when registering the endpoint.** Save it immediately.
- **All event processing must be idempotent** — deduplicate using `event.id`, NOT the webhook delivery ID (WorkOS may retry deliveries).
- **For Events API polling, `last_event_id` must be stored persistently.** If lost, backfill via date-range queries.
- **Do NOT backfill by replaying webhooks.** Webhook signatures expire. Always use the Events API for historical data.

## Endpoints

| Endpoint  | Description   |
| --------- | ------------- |
| `/events` | Events list   |
| `/list`   | events - list |

## See also

- [[WorkOS Management CLI]] — `workos webhook list/create/delete`
