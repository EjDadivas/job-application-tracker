---
title: WorkOS Admin Portal Gotchas
description: Non-obvious traps with Admin Portal links — single-use, intent locking, one active link per org
type: tech
tags: [workos, admin-portal, sso, auth]
created: 2026-04-24
updated: 2026-04-24
related: [[workos-authkit-integration]], [[WorkOS SSO Gotchas]]
source: devkit/raw/workos/plugins/workos/skills/workos/references/workos-admin-portal.md
aliases: ["WorkOS Admin Portal Gotchas"]
---

# WorkOS Admin Portal Gotchas

Docs:
- https://workos.com/docs/admin-portal/index
- https://workos.com/docs/reference/admin-portal/portal-link/generate

## Gotchas

- **Portal links are single-use and time-limited.** Visiting an expired or already-used link returns 404. Must generate a new link each time.
- **Do NOT email portal links directly from your backend.** Links are exposed in email logs. Instead, store the link and have your app's settings page redirect to it.
- **The `intent` parameter determines which screens appear and cannot be changed** after link generation — must generate a new link for a different intent.
- **Only one active portal link exists per organization at a time.** Revoke the old one before generating a new one.
- **Domain verification may be required before SSO activation.** Some configurations need DNS TXT records or email verification first.
- **API key must start with `sk_` (secret key).** Using `pk_` (publishable key) returns "Unauthorized."

## Intent Values

| Intent                 | Opens                        |
| ---------------------- | ---------------------------- |
| `sso`                  | SSO connection setup         |
| `dsync`                | Directory sync               |
| `audit_logs`           | Audit log viewer             |
| `log_streams`          | Log stream config            |
| `domain_verification`  | Domain verification          |
| `certificate_renewal`  | Certificate renewal          |
| `bring_your_own_key`   | BYOK encryption key setup    |

## Endpoints

| Endpoint                | Description                           |
| ----------------------- | ------------------------------------- |
| `/admin-portal`         | Admin portal overview                 |
| `/portal-link/generate` | Generate admin portal link            |

## See also

- [[WorkOS Management CLI]] — `workos portal generate-link --intent=sso --org=org_xxx`
- [[WorkOS SSO Gotchas]] — SSO connection setup
