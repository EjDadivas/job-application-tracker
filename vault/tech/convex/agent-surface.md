---
service: Convex
summary: Reactive TypeScript backend where schema and functions are code an agent deploys
category: database
rating: 5
status: drafted
cli: npx convex
cli_version: 1.45.0
auth: api-key
mcp: true
human_steps: 3
we_use_it: true
last_verified: 2026-08-23
canonical_location: this file
origin: twotabs-devkit/tools-for-agents/convex.md (unreferenced as of 2026-09-05)
---

# Convex

## 1. What it is & when to reach for it

Convex is a reactive backend-as-a-service: TypeScript functions, a document database with a schema, file storage, cron jobs, and realtime subscriptions, all deployed from your repo. Everything an agent needs is code in `convex/` plus a CLI that pushes it — there is no "click here to create a table" step, because the schema *is* a file. That property is what makes it the best-in-class option in this catalog: the agent's normal loop (edit files, run a command) is also the full provisioning loop.

**Reach for something else when:**

- You need raw Postgres, SQL, or an existing SQL toolchain → Neon or Supabase.
- You need the database to be reachable from arbitrary non-JS clients over a standard wire protocol — Convex is accessed through its own client libraries and HTTP API, not a Postgres/MySQL socket.
- You want SQLite semantics or edge-local reads → Turso.

## 2. Agent-readiness rating

**⭐ 5/5** — an agent can go from empty directory to deployed production backend without a browser, after one initial login. The CLI fails fast with actionable errors instead of prompting, and a first-party MCP server ships in the CLI itself.

| Signal | Score | Notes |
|---|---|---|
| **CLI** — scriptable, non-interactive, headless | 5/5 | 20 commands; every destructive one has a non-interactive path. Verified: errors instead of prompting when args are missing. |
| **Auth** — env-var tokens, not browser-only | 5/5 | `CONVEX_DEPLOY_KEY` for CI, `CONVEX_DEPLOYMENT` for local. One browser login, then scriptable forever. |
| **Machine-readable output** — `--json`, meaningful exit codes | 4/5 | `logs --jsonl`, `insights --json`, `data --format jsonl`, `function-spec --file`. Not universal — no global `--json`, and `env list` offers only `--names-only`. Exit code 1 with a clear message on failure (verified). |
| **Lifecycle coverage** — can it *create* resources? | 5/5 | `project create`, `deployment create`, plus a 45-endpoint Management API covering projects, deployments, deploy keys, custom domains, members, and audit logs. |
| **Docs** — ingestible by an agent | 5/5 | `llms.txt`, a public OpenAPI spec at `api.convex.dev/v1/openapi.json`, dedicated AI/agents docs section, first-party MCP server. |

## 3. Setup — the one-time human part

1. 🧑 Create a Convex account at [convex.dev](https://convex.dev) (GitHub OAuth).
2. Run `npx convex dev` in the project once. On first run it opens a browser for device authorization. 🧑 Approve it. This writes a user access token to `~/.convex/config.json` and a `CONVEX_DEPLOYMENT` line to `.env.local`.
3. For CI/production deploys, generate a deploy key. 🧑 Dashboard → Project → Settings → *Deploy Keys* → Generate. (Also creatable over the Management API — see §4 — but that itself needs a Team Access Token created in the dashboard.)
4. Expose it to the agent:

```bash
export CONVEX_DEPLOY_KEY="prod:your-deployment|ey..."   # or: op read "op://Agents/convex/deploy-key"
```

**Human cost:** 3 🧑 steps (account creation, device-auth approval, deploy-key generation), ~5 minutes.

## 4. The agent surface

### Install

No global install needed — always invoke through `npx`, which pins the version in `package.json`:

```bash
npm install convex
npx convex --version
```

Verified output: `1.45.0`

### Auth

The CLI resolves its target deployment in this order: `CONVEX_DEPLOY_KEY` (CI), then `CONVEX_DEPLOYMENT` (local, from `.env.local`), then `--deployment`/`--prod` flags.

```bash
npx convex env list        # succeeds if auth + deployment resolve
```

Outside a configured project this exits 1 with (verified):

```
✖ No CONVEX_DEPLOYMENT set, run `npx convex dev` to configure a Convex project
```

### Commands that matter

| Command | What it does | Non-interactive / JSON |
|---|---|---|
| `convex dev --once` | Push code + regenerate types, exit (don't watch) | `--once`, `--until-success` |
| `convex deploy` | Typecheck, bundle, push to prod | `--dry-run`, `--cmd`, `--message` |
| `convex run <fn> '<json>'` | Invoke a function | `--prod`, `--push`, `--identity` |
| `convex run --inline-query '<js>'` | Sandboxed read-only query, no deploy needed | returns JSON |
| `convex data [table]` | List tables / documents | `--format jsonl`, `--limit`, `--order` |
| `convex env set/get/list/remove` | Deployment env vars | `--from-file .env`, `--names-only` |
| `convex logs` | Stream function logs | `--jsonl`, `--history <n>`, `--success` |
| `convex export --path x.zip` | Snapshot data (+ files) | `--include-file-storage` |
| `convex import <file>` | Load data | `-y`, `--replace`, `--table` |
| `convex insights --json` | OCC conflicts / limit issues, last 72h | `--json`, `--details` |
| `convex project create <name>` | Create a project | name must be an argument, not a prompt |
| `convex function-spec --file` | Dump function signatures as JSON | agent-readable API surface |

### API & SDKs

**Management API** — `https://api.convex.dev/v1`, `Authorization: Bearer <token>`. Verified: 45 endpoints, public OpenAPI spec at `https://api.convex.dev/v1/openapi.json`. Covers `POST /teams/{team_id}/create_project`, `POST /projects/{project_id}/create_deployment`, `create_deploy_key`, `create_custom_domain`, `list_audit_log_events`, and member/role management. NPM wrapper: `@convex-dev/platform`.

⚠️ This API takes **Team Access Tokens or OAuth tokens** — not the CLI's user token. See §6.

**Client libraries** — `convex/react`, `convex/browser`, plus Python/Rust clients and a deployment HTTP API for server-to-server calls.

### MCP server

First-party, ships in the CLI (BETA):

```bash
npx convex mcp start --project-dir /path/to/project
```

Tools exposed: `data`, `envGet`, `envList`, `envRemove`, `envSet`, `functionSpec`, `insights`, `logs`, `run`, `runOneoffQuery`, `status`, `tables`.

Safety defaults worth knowing (verified from `--help`): production is **off** by default. `--cautiously-allow-production-pii` enables read-only tools against prod; `--dangerously-enable-production-deployments` enables mutating tools against prod. Narrow the surface with `--disable-tools envGet,envList`.

## 5. Best-practice recipes

### Recipe: Provision a new project from an empty directory

**Goal:** Empty dir → running dev deployment with generated types.
**Preconditions:** Logged in (§3 step 2).

```bash
npm install convex
npx convex project create my-app
npx convex dev --once
```

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · npx convex 1.45.0

---

### Recipe: Deploy to production from CI

**Goal:** Typecheck, bundle, and push to the prod deployment with no interactive steps.
**Preconditions:** `CONVEX_DEPLOY_KEY` set to a **production** deploy key.

```bash
export CONVEX_DEPLOY_KEY="prod:...|ey..."
npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL --message "$GIT_SHA"
```

`--dry-run` prints the generated configuration without pushing — use it as a safe preflight in an agent loop.

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · npx convex 1.45.0

---

### Recipe: Inspect data without deploying code

**Goal:** Let an agent answer questions about live data with zero deploy risk.
**Preconditions:** Configured project.

```bash
npx convex data                                             # list tables
npx convex data messages --limit 20 --format jsonl          # newest 20 docs as JSONL
npx convex run --inline-query 'await ctx.db.query("messages").take(5)'
```

`--inline-query` is fully sandboxed — it cannot write to the database or reach the network. This is the single most useful agent affordance in the CLI: arbitrary read queries with no deploy and no mutation risk.

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · npx convex 1.45.0

---

### Recipe: Tail logs and triage health

**Goal:** Machine-readable observability in an agent loop.

```bash
npx convex logs --history 200 --jsonl --success   # structured, terminates
npx convex insights --json --prod                 # OCC conflicts + limit issues, 72h
```

Use `--history <n>` rather than bare `convex logs` in any unattended context — see §6.

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · npx convex 1.45.0

---

### Recipe: Back up before a destructive migration

**Goal:** Recoverable snapshot before `import --replace-all`.

```bash
npx convex export --prod --include-file-storage --path "backup-$(git rev-parse --short HEAD).zip"
npx convex import --prod -y --replace-all migrated.zip
```

Never omit `-y` in an agent context: without it, an import that deletes documents prompts for confirmation.

**Expected output:** ⚠️ Not captured — see §8.

**Verified:** Not verified · npx convex 1.45.0

## 6. Gotchas

### Things that hang an agent

Convex is unusually well-behaved here — verified by running each command with stdin closed outside a project: it exits 1 with an actionable message rather than prompting. The real hazards are the commands that succeed and then never terminate:

- **`convex dev`** watches forever by design → use `--once` (or `--until-success`) in any non-interactive context.
- **`convex logs`** streams forever → use `--history <n>`, which prints and exits.
- **`convex run --watch`** subscribes forever → omit `--watch`.
- **`convex import`** prompts when the import would delete documents → pass `-y`.
- **`convex env set NAME`** with no value prompts interactively → always pass the value, or use `--from-file`.
- **`convex dashboard` / `convex docs`** shell out to a browser → never useful to an agent; don't call them.
- **`convex dev --configure`** without `--team`/`--project` prompts interactively → pass both, or use `project create` first.

### Everything else

- **The CLI token is not the API token.** `~/.convex/config.json` holds a user access token from `convex login`. Passing it to the Management API returns HTTP 403 (verified): `{"code":"NotOAuthTeamToken","message":"The token details endpoint only works with OAuth team tokens"}`. Team Access Tokens are created in the dashboard 🧑. Budget for this — it's the one place the "no dashboard" story breaks.
- **Node 26 stderr noise.** Every invocation emits `ExperimentalWarning: localStorage is not available because --localstorage-file was not provided` on stderr (verified, node v26.5.1). Harmless, but it will pollute agent logs and any stderr-based error detection — match on exit codes, not stderr emptiness.
- **Deploy key type matters.** `--preview-create` errors unless the key is a *preview* deploy key. Production keys and preview keys are distinct credential classes.
- **`convex insights` is cloud-only** — unavailable for self-hosted deployments, and requires being logged in as a user.
- **`npx convex@latest` re-resolves on every call.** Pin `convex` in `package.json` and call `npx convex` so agent runs are reproducible and fast.

## 7. CLAUDE.md snippet

```markdown
## Convex

This project's backend is Convex. Schema and functions live in `convex/` — they are
code, so changing the backend means editing files and pushing, never using a dashboard.

Auth: `CONVEX_DEPLOY_KEY` (CI) or `.env.local`'s `CONVEX_DEPLOYMENT` (local).

Commands:
- `npx convex dev --once` — push code + regenerate types, then exit. NEVER run bare
  `npx convex dev`; it watches forever and will hang you.
- `npx convex deploy --dry-run` — safe preflight. Drop `--dry-run` to ship to prod.
- `npx convex data <table> --format jsonl --limit 20` — inspect documents.
- `npx convex run --inline-query 'await ctx.db.query("t").take(5)'` — sandboxed
  read-only query. Cannot write or reach the network. Prefer this for investigation.
- `npx convex run <fn> '<json-args>'` — invoke a function. Add `--prod` for production.
- `npx convex logs --history 200 --jsonl` — structured logs that terminate.
  Bare `npx convex logs` streams forever.
- `npx convex env set NAME value` — always pass the value; a bare name prompts.
- `npx convex import -y ...` — `-y` is required or it prompts before deleting docs.

Gotchas:
- Every command prints an `ExperimentalWarning` about localStorage on stderr under
  Node 26. It is harmless — judge success by exit code, not by stderr being empty.
- Outside a configured project every command exits 1 with "No CONVEX_DEPLOYMENT set".
  Fix by configuring the project, not by retrying.
```

## 8. Verification log

| Date | CLI version | What was run | By |
|---|---|---|---|
| 2026-08-23 | npx convex 1.45.0 | `--version`, `--help`, and `--help` for all 12 major subcommands | Claude Opus 5 |
| 2026-08-23 | npx convex 1.45.0 | `data`, `env list`, `deployment usage`, `insights --json`, `project create` run with stdin closed outside a project — confirmed fail-fast, exit 1, no hangs | Claude Opus 5 |
| 2026-08-23 | n/a | `GET https://api.convex.dev/v1/openapi.json` — 45 endpoints enumerated | Claude Opus 5 |
| 2026-08-23 | n/a | `GET /v1/token_details` with the CLI's user token → HTTP 403 `NotOAuthTeamToken`; with no token → HTTP 401 | Claude Opus 5 |

**Not verified:**

- **Every recipe in §5.** No Convex project is configured on this machine, and verifying them requires creating a real project and deployment in the account's team — a side effect not taken without approval. All five recipes are written from verified `--help` output and docs, not from execution.
- MCP server tool behavior — `mcp start --help` was read, but the server was never started or connected to a client.
- Management API write endpoints (`create_project`, `create_deployment`, `create_deploy_key`) — enumerated from the OpenAPI spec only; never called, since no Team Access Token exists.
- The `llms.txt` claim in §2 — `docs.convex.dev` references `convex.dev/llms.txt` but the file itself was not fetched and its size/structure is unconfirmed.

**Related research:** N/A — no memo in `research/` covers Convex.