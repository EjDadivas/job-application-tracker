---
name: resend
description: Resend email — transactional sends from Convex actions, React Email templates, Audiences, broadcasts, and the @convex-dev/resend component. Use when building or debugging email sends, templates, or webhook handlers.
---

# Resend Email Guidelines

Content for this skill lives in the Obsidian vault as atomic, wikilinked notes.

**Start here:** `vault/_index.md` (Email section)

**Key notes:**

- `vault/tech/resend/overview.md` — two-channel architecture (transactional vs broadcast), Audience sync, scheduler decision (Convex over Resend `scheduledAt`)
- `vault/tech/resend/sdk-patterns.md` — no-throw pattern, idempotency keys, error dispatch, testMode address, webhook verification, batch limits
- `vault/tech/resend/react-email.md` — React Email styling constraints, email client limitations, component structure rules
- `vault/architecture/backend/resend-component.md` — `@convex-dev/resend` component: workpool-backed delivery, testMode gotcha, webhook handler setup

**Rules:** `vault/_conventions.md`

Navigate from `_index.md` — do not read the whole vault.
