# Convex — traps and detail

Read when a Part C Convex step fails. Deeper notes: `vault/tech/convex/agent-surface.md`.

## Never run bare `npx convex dev`

It watches for changes and never exits, which hangs the session. Use `npx convex dev --once`.

Same for logs: `npx convex logs` never terminates. Use `npx convex logs --history 200 --jsonl`.

## Login is the only interactive step

`npx convex login` opens a browser for device authorization and needs a TTY, so 🧑 the user runs
it in their own terminal. It writes a token to `~/.convex/config.json`; `npx convex login status`
reads it back and lists the teams the token can reach.

Everything after that has flags. `npx convex dev` asked interactively for: what to configure,
team, project name, cloud or local, AI files. The same run without prompts:

```bash
npx convex dev --once --configure new --team <team_slug> --project <name> --dev-deployment cloud
```

`--configure existing` attaches to a project that exists. AI files are already declined by
`convex.json`. If `CONVEX_DEPLOYMENT` is missing afterwards, the login was skipped or denied;
check that variable before anything else.

## Convex AI files are opted out, on purpose

`npx convex dev` installs a bundle it calls *AI files*: `convex/_generated/ai/guidelines.md`, a
managed Convex section injected into `AGENTS.md` and `CLAUDE.md`, and agent skills written to each
coding agent's native path. This template deleted those deliberately — its guidance lives in
`vault/` and one `CLAUDE.md` — so `convex.json` sets `"aiFiles": { "enabled": false }`.

Deleting the files is not enough: after a delete, `npx convex dev` suggests reinstalling them, and
they come back. Only the `convex.json` flag stops the prompting. If the block goes missing, restore
it rather than deleting the files again:

```bash
npx convex ai-files disable   # writes the flag back
npx convex ai-files remove    # deletes any files already installed
```

## Env vars the app reads

Both are required, and they are different URLs:

| Var | Value shape |
|---|---|
| `VITE_CONVEX_URL` | `https://<name>.convex.cloud` — the function endpoint |
| `VITE_CONVEX_SITE_URL` | `https://<name>.convex.site` — HTTP actions and webhooks |

## CI

`npx convex deployment token create <name> --deployment prod` prints a production deploy key
(needs `convex login`, no dashboard); set it as `CONVEX_DEPLOY_KEY` in CI or the host. Drop
`--deployment prod` for a key scoped to the dev deployment in `.env.local`. Not needed for local
dev. Only the project-level **Preview** key still comes from the dashboard.
