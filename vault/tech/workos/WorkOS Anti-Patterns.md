---
tags: [workos, anti-patterns, index]
related-skill: workos
---

# WorkOS Anti-Patterns

## RBAC

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Checking `role.slug === 'admin'` | Breaks in multi-org with custom roles | [[WorkOS RBAC Gotchas]] — check permissions, not role slugs |
| Role assignment using user ID instead of membership ID | Assignment silently fails | [[WorkOS RBAC Gotchas]] |
| Relying on API/Dashboard role assignments when IdP mapping is active | IdP silently overrides on every auth | [[WorkOS RBAC Gotchas]] |
| Permission slug typo (`"video.create"` vs `"videos.create"`) | Denies access without error | [[WorkOS RBAC Gotchas]] |
| Expecting role change to take effect immediately | Role won't apply until re-auth | [[WorkOS RBAC Gotchas]] |
| Creating org-level roles without understanding isolation | Permanent org isolation; irreversible | [[WorkOS RBAC Gotchas]] |
| Using full org-level role slug without `org:` prefix | Assignment fails silently | [[WorkOS RBAC Gotchas]] — prefix is `org:custom_admin` |

## SSO

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Combining multiple connection selectors (`connection` + `organization` + `provider`) | Ambiguous; undefined which wins | [[WorkOS SSO Gotchas]] — use exactly one |
| `domain_hint` / `login_hint` as connection selectors | These are UX hints only, not selectors | [[WorkOS SSO Gotchas]] |
| Treating IdP-initiated `state=""` as missing/invalid | Skips CSRF for legitimate flow | [[WorkOS SSO Gotchas]] — empty string is valid; reject null/missing |
| Storing or retrying auth codes | Codes expire in 10 min, single-use | [[WorkOS SSO Gotchas]] — exchange immediately |
| Code exchange before checking `req.query.error` | Exchanges cancelled/failed logins | [[WorkOS SSO Gotchas]] |
| Assuming email domain auto-resolves to org | App must map domain → org_id | [[WorkOS SSO Gotchas]] |
| Redirect URI trailing slash mismatch | `invalid_grant` | [[WorkOS SSO Gotchas]] — must match EXACTLY |
| `getProfile` instead of `getProfileAndToken` | Loses access token | [[WorkOS SSO Gotchas]] |

## Admin Portal

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Emailing portal links directly from backend | Link exposed in email logs | [[WorkOS Admin Portal Gotchas]] — store and redirect |
| Reusing an admin portal link | Single-use; second visit returns 404 | [[WorkOS Admin Portal Gotchas]] — generate fresh per request |
| Changing `intent` after link generation | Not supported | [[WorkOS Admin Portal Gotchas]] — regenerate with new intent |
| Generating multiple portal links per org | Only one active link per org at a time | [[WorkOS Admin Portal Gotchas]] |
| Using `pk_` API key | Returns Unauthorized | [[WorkOS Admin Portal Gotchas]] — use `sk_` key |

## Events & Webhooks

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Polling Events API AND receiving webhooks simultaneously | Duplicate event processing | [[WorkOS Events & Webhooks Gotchas]] — pick one |
| Webhook response takes > 5 seconds | WorkOS retries; duplicate processing | [[WorkOS Events & Webhooks Gotchas]] — ack immediately, process async |
| Verifying signature after `req.json()` | JSON parsing destroys raw body signature | [[WorkOS Events & Webhooks Gotchas]] — verify from `req.text()` |
| Deduplicating by webhook delivery ID | Delivery IDs change on retry | [[WorkOS Events & Webhooks Gotchas]] — deduplicate on `event.id` |
| Backfilling by replaying webhooks | Signatures expire | [[WorkOS Events & Webhooks Gotchas]] — use Events API for historical data |
| Not storing `last_event_id` persistently | Loses cursor on restart | [[WorkOS Events & Webhooks Gotchas]] |

## Vault

| ❌ Anti-pattern | Symptom | Correct pattern |
|---|---|---|
| Using internal customer IDs as `organization_id` | WorkOS expects `org_*` format | [[WorkOS Vault Gotchas]] |
| Storing PII in key context metadata | Metadata is NOT separately encrypted | [[WorkOS Vault Gotchas]] |
| Case-mismatched key names | Silently returns "key not found" | [[WorkOS Vault Gotchas]] — keys are case-sensitive |
| Acting immediately after BYOK KMS IAM change | IAM propagation takes 5–10 min | [[WorkOS Vault Gotchas]] |
