---
title: WorkOS RBAC Gotchas
description: Non-obvious traps in WorkOS role-based access control — permission checks, membership IDs, IdP mapping overrides
type: tech
tags: [workos, rbac, auth, roles, permissions]
created: 2026-04-24
updated: 2026-04-24
related: [[workos-authkit-integration]], [[auth-overview]]
source: devkit/raw/workos/plugins/workos/skills/workos/references/workos-rbac.md
aliases: ["WorkOS RBAC Gotchas"]
---

# WorkOS RBAC Gotchas

Docs: https://workos.com/docs/rbac/quick-start

## Gotchas

- **Check permissions, not role slugs.** Always `role.permissions.includes('action')`, NOT `role.slug === 'admin'` — slug checks break in multi-org scenarios with custom roles.
- **Role assignment requires the membership ID, not the user ID.** Fetch via `listOrganizationMemberships()` first, then call `updateOrganizationMembership(membershipId, { roleSlug })`.
- **IdP group mapping silently overrides API/Dashboard role assignments** on every auth. Changes via `updateOrganizationMembership()` revert on next login if IdP mapping exists.
- **IdP role mapping only works with environment-level roles**, not org-level roles.
- **First org-level role creation permanently isolates that org** — it stops inheriting environment-level role changes. Irreversible.
- **Org-level role slugs are auto-prefixed with `org:`** — use the full slug `"org:custom_admin"`, not `"custom_admin"`.
- **Stale session after role change** — a role assigned after login won't take effect until the user re-authenticates. Force re-auth or refresh the session.
- **Permission slug typos fail silently** — `"video.create"` vs `"videos.create"` won't error, just denies access.

## Endpoints

| Endpoint                               | Description                     |
| -------------------------------------- | ------------------------------- |
| `/roles`                               | Roles overview                  |
| `/organization-role`                   | Organization role management    |
| `/organization-role/add-permission`    | Add permission to org role      |
| `/organization-role/create`            | Create org role                 |
| `/organization-role/delete`            | Delete org role                 |
| `/organization-role/get`               | Get org role                    |
| `/organization-role/list`              | List org roles                  |
| `/organization-role/remove-permission` | Remove permission from org role |
| `/organization-role/set-permissions`   | Set permissions on org role     |
| `/organization-role/update`            | Update org role                 |
| `/permission`                          | Permission management           |
| `/permission/create`                   | Create permission               |
| `/permission/delete`                   | Delete permission               |
| `/permission/get`                      | Get permission                  |
| `/permission/list`                     | List permissions                |
| `/permission/update`                   | Update permission               |
| `/role`                                | Environment role management     |
| `/role/add-permission`                 | Add permission to role          |
| `/role/create`                         | Create role                     |
| `/role/get`                            | Get role                        |
| `/role/list`                           | List roles                      |
| `/role/set-permissions`                | Set permissions on role         |
| `/role/update`                         | Update role                     |

## See also

- [[workos-authkit-integration]] — env vars and Convex auth config
- [[auth-overview]] — `ctx.auth.getUserIdentity()` and Convex auth gotchas
- [[WorkOS Management CLI]] — `workos role`, `workos permission`, `workos membership` commands
