---
title: WorkOS SSO Gotchas
description: Non-obvious traps in WorkOS Single Sign-On — connection selectors, IdP-initiated flow, code exchange
type: tech
tags: [workos, sso, saml, oidc, auth]
created: 2026-04-24
updated: 2026-04-24
related: [[workos-authkit-integration]], [[WorkOS RBAC Gotchas]]
source: devkit/raw/workos/plugins/workos/skills/workos/references/workos-sso.md
aliases: ["WorkOS SSO Gotchas"]
---

# WorkOS SSO Gotchas

Docs:
- https://workos.com/docs/sso/guide
- https://workos.com/docs/sso/login-flows
- https://workos.com/docs/reference/sso/get-authorization-url

## Gotchas

- **Use exactly ONE connection selector** (`connection`, `organization`, OR `provider`) in `getAuthorizationUrl` — never combine them, causes error.
- **`domain_hint` and `login_hint` are UX params, NOT connection selectors** — they pre-fill fields but don't route the request.
- **IdP-initiated flow sends `state=""` (empty string, not missing)** — skip CSRF verification for empty string, reject for null/missing.
- **Auth codes expire in 10 min and are single-use** — exchange immediately in callback, never store or retry.
- **`signin_consent_denied` means user clicked Cancel at IdP** — check `req.query.error` BEFORE attempting code exchange.
- **Email domain does NOT auto-resolve to organization** — your app must map email domain → `org_id` via your DB or the Organizations API.
- **Redirect URI must match EXACTLY including trailing slash** — mismatch causes `invalid_grant`.
- **Use `getProfileAndToken`, not `getProfile`** to exchange code — returns both profile and access token.

## Endpoints

| Endpoint                              | Description                       |
| ------------------------------------- | --------------------------------- |
| `/sso`                                | SSO overview                      |
| `/connection`                         | SSO connection management         |
| `/connection/delete`                  | Delete a connection               |
| `/connection/get`                     | Get a connection                  |
| `/connection/list`                    | List connections                  |
| `/get-authorization-url`              | Generate authorization URL        |
| `/get-authorization-url/error-codes`  | Authorization error codes         |
| `/get-authorization-url/redirect-uri` | Redirect URI configuration        |
| `/profile/get-profile-and-token`      | Exchange code for profile + token |
| `/profile/get-user-profile`           | Get user profile by ID            |

## See also

- [[workos-authkit-integration]] — redirect URI config and env vars
- [[WorkOS RBAC Gotchas]] — role assignment after SSO
- [[WorkOS Terms]] — Organization ID vs Connection ID distinction
