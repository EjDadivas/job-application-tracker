---
title: Email Architecture
description: Project email architecture — two channels, Resend Audiences, Convex scheduler design decision, broadcast segments
type: tech
tags: [email, resend, architecture, convex, audiences]

---

# Email Architecture

Email is powered by **Resend**. Two distinct channels: transactional (triggered by user actions via Convex actions) and marketing/broadcasts (via Resend Broadcasts dashboard or API, managed from `/admin/broadcasts`).

## Two email channels

| Channel | Trigger | Sender | Examples |
|---------|---------|--------|---------|
| **Transactional** | Convex actions | Resend API | Project invitations, reminder emails, welcome on join |
| **Broadcast / Marketing** | Resend dashboard or Broadcasts API | Resend | Product updates, re-engagement, upsell nudges |

## Transactional email flow

```
User action → Convex mutation → schedules Convex action
             → action calls Resend API with rendered template
             → Resend delivers email
```

Templates live in `convex/email/templates/`. Renderer in `convex/email/renderer.ts`.

Template types:
- `projectInvitation.tsx` — invite existing user to a project
- `workspaceAndProjectInvitation.tsx` — invite new user (creates WorkOS + Convex account)
- `MarketingEmail.tsx`, `NotificationEmail.tsx`, `TransactionalEmail.tsx` — base templates
- `registryComponents.tsx` — shared component registry

## Resend Audiences

Every user is added to a Resend Audience on sign-up. Contact data synced:

```json
{
  "email": "user@example.com",
  "first_name": "...",
  "last_name": "...",
  "data": {
    "role": "owner | client",
    "plan": "free | pro | enterprise",
    "workspace_count": 1,
    "project_count": 3,
    "signed_up_at": "YYYY-MM-DD"
  }
}
```

`resendContactId` stored on the `users` Convex record.

## Scheduled emails — Convex scheduler over Resend `scheduledAt`

Invitation reminders use `ctx.scheduler.runAfter` (Convex), **not** Resend's `scheduledAt`.

**Why:** Convex jobs can check current invitation status before sending and skip if already accepted/revoked. Resend's `scheduledAt` is fire-and-forget with complex cancellation.

`reminderJobId` stored on `projectInvitations` so the job can be cancelled if the invitation is accepted/revoked before firing.

## Segments (for broadcasts)

| Segment | Filter |
|---------|--------|
| Owners | `data.role = "owner"` |
| Clients | `data.role = "client"` |
| Free owners | `role=owner AND plan=free` |
| Power users | `project_count >= 5` |

## Open questions

- Should clients be in the Resend audience at all, or only owners?
- Monthly digest: opt-in or opt-out?
- Referral program: on roadmap?

## See also

- [[sdk-patterns]] — Resend SDK gotchas for email-sending actions
- [[react-email]] — React Email constraints for template authoring
