# Seed: CLAUDE.md § Stack notes

Copy everything below the `---` into `CLAUDE.md` under `## Stack notes`. Delete the blocks for
services this project does not use. **Change nothing else.**

These are *traps* only — the things an agent hits before it would ever think to open a doc. The
full command surface, recipes and API detail live in the vault, which the agent reads on demand.
If you find yourself adding a command, an API route, or a fact you read out of `.env.local`, stop:
that belongs in the vault file, not here.

**Never write environment state into this section** — not the key prefix in use, not the region,
not staging-vs-production. `CLAUDE.md` is committed and nothing keeps it in sync with
`.env.local`, so it goes stale silently and the agent trusts it anyway.

---

## Stack notes

### Convex

Backend is Convex. Schema and functions are code in `convex/` — change the backend by editing
files and pushing, never through a dashboard.

- `npx convex dev --once` — push and regenerate types, then exit. **Never run bare
  `npx convex dev`**; it watches forever and hangs the session.
- `npx convex logs --history 200 --jsonl` — terminates. Bare `npx convex logs` streams forever.
- Every command prints an `ExperimentalWarning` on stderr. Judge success by exit code.

Commands, recipes and gotchas: `vault/tech/convex/agent-surface.md`

### TanStack Start

Routes are files under `src/routes/`, and `src/routeTree.gen.ts` is generated from them by the
Vite plugin — nothing else rebuilds it.

- After adding, renaming or moving a route, run `npm run gen` **before** `npm run lint`. Skip it
  and `tsc` reports the new route as missing from the router type union — errors that read like
  application bugs and are not.
- `npm run gen` is `vite build`; it terminates. `npm run dev` also regenerates, but watches
  forever — never run it to fix types.

### WorkOS

Dashboard work has a CLI: `npx workos@latest` (environments, redirect URIs, orgs, users, `doctor`).
App code talks to WorkOS through `@workos-inc/node`.

- You **cannot** complete an SSO connection from code — that needs the customer's IdP admin.
  Generate an Admin Portal link and hand it over; never poll unbounded waiting for it to go live.

API surface, portal links and gotchas: `vault/tech/workos/agent-surface.md`

### Netlify

Deploys run `npx convex deploy --cmd '<pm> run build'` from `netlify.toml`; Convex injects
`VITE_CONVEX_URL` into that build, so never set it by hand in Netlify.

- Exit code 4 from any `netlify` command means it wanted a person. Re-run with explicit flags.
- Never run `netlify login`, `init`, `open`, `dev` or `create`; `link` only with `--name`.
- `npx netlify env:set K V --context production` sets a variable; `env:list --json` reads them.

### PostHog

`posthog-cli` exists (browser login, or `POSTHOG_HOST` / `POSTHOG_PROJECT_ID` / `POSTHOG_API_KEY` headless);
the official MCP server is `https://mcp.posthog.com/mcp`. App code uses `posthog-js` and `posthog-node`.

- `phc_…` is the **project** key — write-only ingestion, safe in client code, cannot read.
- `phx_…` is the **personal** key — read and manage, server-side only. **Never put it in a
  `VITE_` variable**; Vite inlines those into the browser bundle.
- On an auth error, check the key prefix before assuming the key is bad.

Query API, flags and gotchas: `vault/tech/posthog/agent-surface.md`
