---
service: PostHog
summary: Product analytics, feature flags, and session replay with a queryable SQL API
category: analytics
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
origin: twotabs-devkit/tools-for-agents/posthog.md (unreferenced as of 2026-09-05)
---

# PostHog

## 1. What it is & when to reach for it

PostHog bundles product analytics, feature flags, session replay, surveys, and experiments behind one SDK. For an agent the interesting part is not the dashboards — it is that **event data is queryable as SQL** through the HogQL query endpoint, and that **feature flags are fully manageable over the API**. Those two together mean an agent can answer "did that change help?" and then act on the answer by flipping a flag, without a human opening a browser.

**Reach for something else when:**

- You need error monitoring and stack traces as the primary concern — that is a different tool's job.
- You only need flags, not analytics; a dedicated flag service is lighter.

## 2. Agent-readiness rating

**⭐ 4/5** — one-time human setup, then querying data, managing feature flags, and reading insights are all API-driven with a personal API key. Held below 5 because organization and project creation are effectively dashboard-bound, and because the two key types are easy to confuse in a way that silently fails.

| Signal | Score | Notes |
|---|---|---|
| **CLI** — scriptable, non-interactive, headless | 1/5 | No official CLI found on npm or Homebrew. `@posthog/agent-toolkit` v0.2.4 exists (verified) but is a library for agent frameworks, not a command-line tool. |
| **Auth** — env-var tokens, not browser-only | 4/5 | Personal API key as a bearer token, no browser. Docked because of the two-key-type trap in §6 — the wrong one fails in a confusing way. |
| **Machine-readable output** | 5/5 | JSON REST with structured errors carrying `type`, `code`, and `detail` — verified. Among the most branchable error shapes in the catalog. |
| **Lifecycle coverage** — can it *create* resources? | 4/5 | Feature flags, insights, dashboards, cohorts, annotations, and surveys are all creatable over the API. Organizations and projects are effectively dashboard work. |
| **Docs** — ingestible by an agent | 5/5 | `posthog.com/llms.txt` returns 200 (verified). PostHog's docs are open source, unusually thorough, and they ship a first-party agent toolkit — a real signal of intent. |

## 3. Setup — the one-time human part

1. 🧑 Create a PostHog account and a project (choose US or EU cloud — this fixes your API host).
2. 🧑 Create a **Personal API Key** under user settings, scoped to the permissions you need.

```bash
export POSTHOG_API_KEY="phx_..."                 # personal key — for reading and managing
export POSTHOG_HOST="https://us.posthog.com"     # or https://eu.posthog.com
export POSTHOG_PROJECT_ID="12345"
```

**Human cost:** 2 🧑 steps, ~5 minutes.

## 4. The agent surface

### Install

N/A — no CLI exists. Checked npm and Homebrew for an official first-party command-line tool; only SDKs and the agent toolkit are published. Agents use `curl` or `posthog-node` (v5.50.0, verified, updated 2026-08-21).

### Auth

⚠️ **PostHog has two different key types and confusing them is the most common failure.**

| Key | Prefix | What it does |
|---|---|---|
| **Project API key** | `phc_` | **Write-only ingestion.** Safe to ship in client-side code. Cannot read anything. |
| **Personal API key** | `phx_` | **Read and manage.** Full API access, scoped by permissions. Server-side only — never expose it. |

An agent that tries to read data with a project key gets an auth error and may conclude its credentials are wrong when it simply has the wrong *kind* of credential.

An unauthenticated request returns (verified verbatim):

```
HTTP 401
{"type":"authentication_error","code":"not_authenticated",
 "detail":"Authentication credentials were not provided.","attr":null}
```

Both `type` and `code` are stable identifiers — branch on `code`.

### Commands that matter

N/A — no CLI. The API below is the surface.

### API & SDKs

Base: `https://us.posthog.com/api` or `https://eu.posthog.com/api`, bearer auth with the personal key.

| Endpoint | Purpose |
|---|---|
| `POST /api/projects/{id}/query/` | **Run HogQL (SQL) against event data** — the highest-value endpoint for an agent |
| `GET/POST/PATCH /api/projects/{id}/feature_flags/` | Full feature-flag CRUD, including rollout percentages and filters |
| `GET /api/projects/{id}/insights/` | Saved insights |
| `GET /api/projects/{id}/session_recordings/` | Session replay metadata |
| `GET/POST /api/projects/{id}/cohorts/` | Cohort definitions |
| `POST /api/projects/{id}/annotations/` | Mark deploys on charts |
| `POST /i/v0/e/` (ingestion) | Capture events — uses the **project** key, not the personal key |

**SDKs:** `posthog-node` v5.50.0 (verified) plus browser, Python, Go, Ruby, PHP, and mobile clients. **`@posthog/agent-toolkit` v0.2.4** (verified, updated 2026-08-12) is PostHog's first-party library for wiring PostHog into agent frameworks — the natural starting point rather than a third-party connector.

### MCP server

⚠️ **Not confirmed first-party in this session.** A registry search returned six name matches for `posthog`; none was verified as official here. PostHog has publicly worked on MCP tooling and `@posthog/agent-toolkit` is unambiguously first-party, so an official server may well exist — this guide simply will not assert it unchecked. Verify before wiring one in: a personal API key can read all of your product analytics.

## 5. Best-practice recipes

⚠️ **None of the recipes below were executed.** No PostHog credentials are available here, and no tracking events were sent to any real project. They are written from PostHog's documented API and the verified auth behavior above.

### Recipe: Query event data as SQL

**Goal:** Let an agent answer a product question directly instead of reading a dashboard.
**Preconditions:** `POSTHOG_API_KEY` (personal), `POSTHOG_PROJECT_ID` set.

```bash
curl -s -X POST "$POSTHOG_HOST/api/projects/$POSTHOG_PROJECT_ID/query/" \
  -H "Authorization: Bearer $POSTHOG_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query":{"kind":"HogQLQuery","query":"select event, count() from events where timestamp > now() - interval 7 day group by event order by count() desc limit 20"}}'
```

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · n/a

---

### Recipe: Roll a feature flag out gradually

```bash
curl -s -X PATCH "$POSTHOG_HOST/api/projects/$POSTHOG_PROJECT_ID/feature_flags/$FLAG_ID/" \
  -H "Authorization: Bearer $POSTHOG_API_KEY" -H 'Content-Type: application/json' \
  -d '{"filters":{"groups":[{"properties":[],"rollout_percentage":25}]}}'
```

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · n/a

---

### Recipe: Annotate a deploy so charts explain themselves

```bash
curl -s -X POST "$POSTHOG_HOST/api/projects/$POSTHOG_PROJECT_ID/annotations/" \
  -H "Authorization: Bearer $POSTHOG_API_KEY" -H 'Content-Type: application/json' \
  -d "{\"content\":\"Deployed $GIT_SHA\",\"date_marker\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

A cheap, high-value thing to add to a deploy script — every later "what changed here?" answers itself.

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · n/a

## 6. Gotchas

### Things that hang an agent

No CLI, so nothing prompts. The real risks:

- **A large HogQL query can run for a long time.** Always bound with `limit` and a date range. An unbounded `select * from events` against a busy project is a way to wait forever and burn quota.
- **Session recording exports are large.** Fetch metadata first; do not pull full recordings into an agent's context.

### Everything else

- **🚨 The two key types are the trap.** `phc_` is write-only ingestion; `phx_` is read/manage. Using `phc_` for a read returns an auth error that looks like a bad key rather than the wrong *kind* of key. Check the prefix first when debugging auth. Conversely, **never ship a `phx_` personal key to a browser** — it can read your entire analytics history.
- **US and EU clouds are separate hosts with separate data.** A key issued in one does not work against the other, and querying the wrong host returns empty results rather than an obvious error.
- **Ingestion is fire-and-forget.** `POST /i/v0/e/` returns success without confirming the event was processed. An agent that captures an event and immediately queries for it will usually find nothing — ingestion is asynchronous. Do not build a verification loop on that assumption.
- **Errors carry `type`, `code`, and `detail`** — branch on `code`.
- ⚠️ **Never send test events to a production project.** Analytics data is append-only in practice; a polluted funnel is difficult to clean up and quietly corrupts every metric derived from it. Use a separate dev project.
- ⚠️ **Rate limits and query quotas not investigated.** Confirm before writing an analysis loop.

## 7. CLAUDE.md snippet

```markdown
## PostHog

PostHog is our product analytics, feature flags, and session replay. There is NO
PostHog CLI — use the REST API or `posthog-node`.

TWO KEY TYPES — getting this wrong is the most common failure:
- `phc_...` PROJECT key — write-only ingestion, safe in client code, CANNOT read.
- `phx_...` PERSONAL key — read and manage, server-side ONLY, never ship to a browser.
If a read returns an auth error, check the key PREFIX before assuming the key is bad.

Base URL is region-specific: https://us.posthog.com/api or https://eu.posthog.com/api.
Keys do not work across regions, and the wrong host returns empty results rather
than an error.

Useful calls (Authorization: Bearer $POSTHOG_API_KEY):
- `POST /api/projects/{id}/query/` with {"query":{"kind":"HogQLQuery","query":"select ..."}}
  — run SQL over event data. ALWAYS include a limit and a date range.
- `GET|POST|PATCH /api/projects/{id}/feature_flags/` — full flag CRUD incl. rollout %.
- `POST /api/projects/{id}/annotations/` — mark a deploy on the charts.

Gotchas:
- Ingestion is asynchronous and fire-and-forget. Do not capture an event and then
  immediately query for it — it will not be there yet.
- NEVER send test events to a production project; analytics data is effectively
  append-only and pollutes every derived metric.
- Errors carry a stable `code` field — branch on that.
```

## 8. Verification log

| Date | CLI version | What was run | By |
|---|---|---|---|
| 2026-08-23 | n/a | `GET https://us.posthog.com/api/projects/` unauthenticated → HTTP 401 with `type`/`code`/`detail` body, quoted verbatim in §4 | Claude Opus 5 |
| 2026-08-23 | n/a | `posthog.com/llms.txt` → HTTP 200 | Claude Opus 5 |
| 2026-08-23 | n/a | npm registry: `posthog-node` v5.50.0 (2026-08-21) and `@posthog/agent-toolkit` v0.2.4 (2026-08-12); no official first-party CLI package found | Claude Opus 5 |
| 2026-08-23 | n/a | Official MCP registry searched for `posthog` — 6 name matches, none verified first-party in this session | Claude Opus 5 |

**Not verified:**

- **Every recipe in §5.** No PostHog credentials, and **no events were sent to any real project** — deliberately, since analytics data is effectively append-only.
- **The endpoint table in §4** and the HogQL request envelope in the first recipe — taken from PostHog's documented API, not exercised. The query endpoint is load-bearing for the ⭐4 rating; confirm its exact request shape before relying on it.
- **The `phc_`/`phx_` prefix conventions** — documented by PostHog and widely used, but not confirmed against a live key here. The *behavioral* claim (project keys cannot read) is the important part and is also unverified.
- Whether an official PostHog MCP server exists — six registry matches, none confirmed. `@posthog/agent-toolkit` is confirmed first-party and is the safer starting point.
- Ingestion latency, and how long after capture an event becomes queryable.
- Rate limits, query timeouts, and plan gating — not investigated.

**Related research:** N/A.