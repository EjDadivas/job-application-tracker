---
title: WorkOS Terms
description: Non-obvious WorkOS terminology — sealed session, initiate_login_uri, redirect URI vs sign-in endpoint
type: tech
tags: [workos, auth, terminology, reference]
created: 2026-04-24
updated: 2026-04-24
related: [[workos-authkit-integration]], [[WorkOS AuthKit + Convex + TanStack Start Integration]]
source: devkit/raw/workos/plugins/workos/skills/workos/references/workos-terms.md
aliases: ["WorkOS Terms"]
---

# WorkOS Terms

## Key Distinctions

| Term                     | What it is                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Redirect URI**         | URL WorkOS redirects to after successful auth. Must match EXACTLY (including trailing slash) in Dashboard → Redirects AND in `WORKOS_REDIRECT_URI`. |
| **Sign-in endpoint**     | URL on YOUR app that AuthKit redirects to when a sign-in request did NOT originate from your app (e.g., bookmark, password-reset email). Configured in Dashboard → Redirects. |
| **`initiate_login_uri`** | OIDC client metadata param an IdP reads to begin IdP-initiated login. Maps to the **Sign-in endpoint** in Dashboard → Redirects. No distinct WorkOS docs page exists under this name. |
| **Sign-out redirect**    | URL users are redirected to after logout. Configured in Dashboard → Redirects and/or passed as `return_to` query param on the logout URL.          |
| **Organization ID**      | Identifier for a group of users (`org_*`). Preferred param for SSO flows — pass instead of Connection ID so the org can pick its active connection. |
| **Connection ID**        | Identifier for a specific SSO connection. Use when you need a specific connection rather than letting the org decide.                              |
| **Sealed session**       | AuthKit session data encrypted and stored in a cookie. Sealing = encrypting with `WORKOS_COOKIE_PASSWORD` at sign-in; unsealing = decrypting on each request. |
| **`WORKOS_COOKIE_PASSWORD`** | 32+ character password used to seal/unseal the session cookie. Must be identical across all app instances. Generate: `openssl rand -base64 32`. |
| **Admin Portal `intent`**| Query param on `generateLink` — selects which admin portal flow opens. Cannot be changed after link generation (see [[WorkOS Admin Portal Gotchas]]). |
| **JWKS endpoint**        | Public key set endpoint used to verify signatures on AuthKit-issued session access tokens.                                                         |

## See also

- [[workos-authkit-integration]] — env vars, redirect URI config
- [[WorkOS Admin Portal Gotchas]] — intent values and portal link gotchas
- [[WorkOS SSO Gotchas]] — Organization ID vs Connection ID in auth flows
