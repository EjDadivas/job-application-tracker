---
service: WorkOS
summary: Enterprise SSO and directory sync where even the human step is delegated by an API call
category: auth
rating: 4
status: drafted
cli: null
cli_version: n/a
auth: api-key
mcp: false
human_steps: 2
we_use_it: true
last_verified: 2026-08-23
canonical_location: this file
origin: twotabs-devkit/tools-for-agents/workos.md (unreferenced as of 2026-09-05)
---

# WorkOS

## 1. What it is & when to reach for it

WorkOS sells the enterprise checklist: SAML/OIDC single sign-on, SCIM directory sync, audit logs, and multi-tenant organization management. Reach for it when your customers are companies whose IT departments demand SSO, rather than individuals signing up with an email address.

Its agent story is better than it first appears, and for a non-obvious reason. SSO setup inherently involves a **third party** — your customer's IdP administrator, who is not you and cannot be automated. Most services would make that a dead end. WorkOS turns it into an API call: `POST /portal/generate_link` produces a hosted setup URL you hand to that admin. The human step still exists, but an agent can *dispatch* it rather than performing it. That is the right shape for a boundary you genuinely cannot cross.

**Reach for something else when:**

- You need consumer-facing sign-in components and self-serve user management as the primary product. WorkOS's value is concentrated in the enterprise parts; a drop-in auth provider fits that job better.
- You have no enterprise customers. WorkOS's value is entirely in the parts individuals never touch.

## 2. Agent-readiness rating

**⭐ 4/5** — one-time human setup, then organizations, connections, directories, and users are all API-driven. The unavoidable human (the customer's IdP admin) is reached through a generated link rather than a dashboard you have to click through yourself.

| Signal | Score | Notes |
|---|---|---|
| **CLI** — scriptable, non-interactive, headless | 1/5 | No official CLI found on npm or Homebrew. Everything runs through the REST API or a server SDK. |
| **Auth** — env-var tokens, not browser-only | 5/5 | A single secret key (`sk_...`) as a bearer token. No OAuth flow, no browser. |
| **Machine-readable output** | 4/5 | JSON REST throughout. Docked because the unauthenticated 401 body is terse — `{"message":"Unauthorized"}` — with no stable error code to branch on. |
| **Lifecycle coverage** — can it *create* resources? | 5/5 | Organizations, connections, directories, users, and Admin Portal links all creatable over the API. This is the strongest lifecycle story of the two auth providers here. |
| **Docs** — ingestible by an agent | 4/5 | `workos.com/docs/llms.txt` returns 200 (verified). Good reference structure; docked only for the absent CLI surface. |

## 3. Setup — the one-time human part

1. 🧑 Create a WorkOS account and note your environment (staging vs. production — they are separate, with separate keys and data).
2. 🧑 Copy the secret API key from the dashboard.

```bash
export WORKOS_API_KEY="sk_test_..."      # or: op read "op://Agents/workos/api-key"
export WORKOS_CLIENT_ID="client_..."     # needed for the AuthKit/SSO flows
```

**Human cost:** 2 🧑 steps, ~5 minutes. Per-customer SSO setup is a recurring human step — but it is *their* admin, dispatched by an API-generated link, not you in a dashboard.

## 4. The agent surface

### Install

N/A — no CLI exists. Checked npm and Homebrew for an official first-party command-line tool; only SDK libraries are published. Agents use the REST API or `@workos-inc/node` (v10.10.0, verified).

### Auth

Bearer token against `https://api.workos.com`. Unauthenticated requests return (verified verbatim):

```
HTTP 401
{"message":"Unauthorized"}
```

⚠️ Note there is no machine-readable error code in that body — you can branch on the HTTP status, but there is no stable error identifier to match against.

### Commands that matter

N/A — no CLI. The weight of this section falls on the API below.

### API & SDKs

**REST API** — `https://api.workos.com`, bearer auth. The groups that matter:

| Area | What an agent can do |
|---|---|
| Organizations | Create, update, list, delete tenants |
| Connections | List and manage SSO connections per organization |
| Directory Sync | List directories, users, and groups; receive SCIM-driven updates |
| User Management | Create users, memberships, invitations, sessions |
| **Admin Portal** | `POST /portal/generate_link` — mint a hosted setup URL for a customer's admin |
| Audit Logs | Emit and export events |
| Webhooks | Configure delivery for directory and connection events |

`generate_link` is the endpoint to understand first. It takes an organization and an intent (`sso`, `dsync`, `audit_logs`, `domain_verification`) and returns a URL. That URL is the entire self-service SSO onboarding flow, and an agent can produce one per customer without touching a browser.

**SDKs:** `@workos-inc/node` v10.10.0 (verified, updated 2026-08-19), plus official Python, Ruby, Go, PHP, Java, and .NET clients.

### MCP server

⚠️ **No official WorkOS MCP server was confirmed.** A registry search returned name matches, but nothing verifiable as first-party. Treat anything you find as community-built until WorkOS documents one — an MCP server here would hold credentials capable of reading and modifying every tenant's identity configuration, which is not a trust decision to make casually.

## 5. Best-practice recipes

⚠️ **None of the recipes below were executed.** No WorkOS credentials are available here. They are written from WorkOS's documented API shape and the verified auth behavior above.

### Recipe: Onboard a new enterprise customer to SSO

**Goal:** Create the tenant and hand its IT admin a self-service setup link — the core WorkOS workflow.
**Preconditions:** `WORKOS_API_KEY` set.

```bash
ORG=$(curl -s -X POST https://api.workos.com/organizations \
  -H "Authorization: Bearer $WORKOS_API_KEY" -H 'Content-Type: application/json' \
  -d '{"name":"Acme Corp","domain_data":[{"domain":"acme.com","state":"verified"}]}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')

curl -s -X POST https://api.workos.com/portal/generate_link \
  -H "Authorization: Bearer $WORKOS_API_KEY" -H 'Content-Type: application/json' \
  -d "{\"organization\":\"$ORG\",\"intent\":\"sso\"}"
```

Send the returned link to the customer's admin. Portal links are short-lived — generate them on demand rather than storing them.

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · n/a

---

### Recipe: Read a synced directory

**Goal:** See which users an enterprise customer's IdP has provisioned.

```bash
curl -s "https://api.workos.com/directory_users?directory=directory_..." \
  -H "Authorization: Bearer $WORKOS_API_KEY"
```

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · n/a

---

### Recipe: Fail fast on bad credentials in CI

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://api.workos.com/organizations \
  -H "Authorization: Bearer $WORKOS_API_KEY"
```

`200` means the key works; `401` means it does not. Because the error body carries no code, the status is all you get — check it explicitly.

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · n/a

## 6. Gotchas

### Things that hang an agent

No CLI, so nothing prompts. The real failure modes:

- **An agent cannot complete an SSO connection**, and should not try. Configuring SAML metadata happens inside the customer's identity provider, by their staff. The correct agent action is to generate a portal link and report it — not to loop looking for an API that finishes the job.
- **Waiting on a connection to become active will block indefinitely.** Activation depends on a human at another company. Poll with a bounded timeout, or use webhooks, and never make a deploy step depend on it.

### Everything else

- **Staging and production are separate environments with separate keys and separate data.** An agent that creates an organization in staging and then queries production will find nothing, and will usually misread that as a bug in its own code.
- **The 401 body has no error code.** Branch on HTTP status; do not pattern-match `"Unauthorized"`, which may change.
- **Portal links expire.** Generate on demand; do not cache them in a database or a config file.
- **Directory Sync is push-driven, not pull-driven.** Data arrives when the customer's IdP sends SCIM updates. An agent that expects to *pull* a fresh roster on demand will read stale data and not know it. Use webhooks for freshness.
- ⚠️ **No official MCP server confirmed.** See §4 — the credential scope makes a community connector a real risk.
- ⚠️ **Rate limits not investigated.** Confirm before writing a bulk-provisioning loop.

## 7. CLAUDE.md snippet

```markdown
## WorkOS

WorkOS provides enterprise SSO, SCIM directory sync, and multi-tenant orgs.
Auth: `Authorization: Bearer $WORKOS_API_KEY` against https://api.workos.com

Dashboard-plane work has a CLI: `npx workos@latest` (see [[management]]). App code uses `@workos-inc/node`.

What you CAN do from code: create and manage organizations, list connections and
directories, read directory users and groups, manage users and invitations, emit
audit log events, and — most importantly — mint Admin Portal links:

  POST /portal/generate_link  {"organization":"org_...","intent":"sso"}

What you CANNOT do: complete an SSO connection. That requires the CUSTOMER'S IdP
administrator to configure SAML/OIDC on their side. The correct move is to generate
a portal link and hand it over. Do not search for an API that finishes setup, and
do not block waiting for a connection to go active — that depends on a human at
another company. Use webhooks or a bounded poll.

Gotchas:
- Staging and production are separate environments with separate data.
- The 401 body has no error code — branch on HTTP status only.
- Portal links are short-lived; generate on demand, never cache.
- Directory Sync is push-based; pulling gives you whatever the last SCIM push left.
```

## 8. Verification log

| Date | CLI version | What was run | By |
|---|---|---|---|
| 2026-08-23 | n/a | `GET https://api.workos.com/organizations` unauthenticated → HTTP 401 `{"message":"Unauthorized"}`, quoted verbatim in §4 | Claude Opus 5 |
| 2026-08-23 | n/a | `workos.com/docs/llms.txt` → HTTP 200 | Claude Opus 5 |
| 2026-08-23 | n/a | npm registry: `@workos-inc/node` v10.10.0, updated 2026-08-19; no official first-party CLI package found | Claude Opus 5 |
| 2026-08-23 | n/a | Official MCP registry searched for `workos` — matches returned but none verifiable as first-party | Claude Opus 5 |

**Not verified:**

- **Every recipe in §5.** No WorkOS credentials available; no authenticated call was made.
- **The endpoint table in §4**, including the `POST /portal/generate_link` request shape and its `intent` values — taken from WorkOS's documented API, not from a spec fetched this session and not exercised. The generate_link behavior is load-bearing for the ⭐4 rating, so confirm it before relying on the rating.
- Whether portal link expiry is what §6 claims, and how long it actually is.
- Whether an official WorkOS MCP server exists — registry matches were ambiguous.
- Rate limits, plan gating, and bulk-provisioning constraints — not investigated.
- Directory Sync push semantics — consistent with SCIM's design and WorkOS's docs, but not observed.

**Related research:** N/A.