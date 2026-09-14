---
name: workos
description: WorkOS auth, RBAC, SSO, admin portal, webhooks, and AuthKit integration. Use when implementing auth flows, role/permission checks, WorkOS webhooks, the admin portal, or widgets.
---

# WorkOS Guidelines

Content for this skill lives in the Obsidian vault as atomic, wikilinked notes.

**Start here:** `vault/_index.md` (WorkOS section)

**Key notes:**

- `vault/tech/workos/terms.md` — sealed session, redirect URI vs sign-in endpoint
- `vault/tech/workos/rbac.md` — permission check gotchas, membership ID requirement
- `vault/tech/workos/sso.md` — connection selector rules, IdP-initiated flow, code expiry
- `vault/tech/workos/admin-portal.md` — single-use links, intent parameter, domain verification
- `vault/tech/workos/management.md` — CLI commands for managing orgs/users/roles/webhooks
- `vault/tech/workos/widgets-token-strategies.md` — widget scope table, elevated token flow
- `vault/tech/workos/events.md` — webhook idempotency, signature verification, polling vs webhooks
- `vault/tech/workos/vault-feature.md` — BYOK, org-scoped encryption, key context rules
- `vault/architecture/auth/workos-authkit-integration.md` — ConvexProviderWithAuth, SSR token injection, callback route; createStart gotchas
- `vault/architecture/frontend/workos-authkit-sdk-reference.md` — server + client exports (`useAuth`, `useAccessToken`, `getAuth`)

**Rules:** `vault/_conventions.md` (B-05 for auth guards; see rbac.md for WorkOS-specific rules)

Navigate from `_index.md` — do not read the whole vault.
