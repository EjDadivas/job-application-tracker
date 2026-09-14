# Netlify — traps and detail

Read before the Part C deployment step touches Netlify, and again if a step fails. Source:
tools-for-agents `guides/netlify.md` (drafted 23 Aug 2026, CLI 27.1.2), Netlify's TanStack Start
guide and Convex's Netlify hosting page, both read 12 Sep 2026.

## The exit codes are a contract

`netlify --help` prints them: `0 ok · 1 error · 2 usage · 4 needs-input`. **Exit 4 means the
command wanted a person.** Re-run with explicit flags; do not retry the same line.

## Commands that hang or open a browser

`netlify login` (browser), `netlify init` (wizard), `netlify open` (browser), `netlify dev` (runs
forever), `netlify create` (interactive AI flow), and `netlify link` with no `--name`/`--id`
(picker), and `netlify env:list` without `--json` (ends in a "Show values?" prompt). 🧑 the user
runs `login` in their own terminal; everything else has flags.

## What each step needs

| Command | Needs | Notes |
|---|---|---|
| `netlify status` | login | prints account and linked site |
| `netlify api listAccountsForUser` | login | team slugs for `--account-slug` |
| `netlify sites:create --name X --account-slug Y` | login | no prompt with both flags |
| `netlify link --name X` | login | bare `link` opens a picker |
| `netlify env:set K V --context production` | login | contexts: `production`, `deploy-preview`, `branch-deploy`, `dev` |
| `netlify deploy --prod --build --json` | login, linked site | runs the `netlify.toml` build command; without `--build` it uploads `publish` as is and skips the Convex push |
| `netlify api <method> --data '<json>'` | login | any REST method with auth handled |

`NETLIFY_AUTH_TOKEN` in the environment replaces the login for CI.

## The Vite plugin's edge-functions emulator

`@netlify/vite-plugin` runs Netlify's local platform inside `vite dev`, including an edge-functions
server that it starts with the machine's global Deno when that Deno satisfies `^2.2.4`. Deno 2.9
dropped `--allow-scripts` from `deno eval`, and `@netlify/edge-functions-dev` 2.0.1 still passes
it, so on a machine with a current Deno the dev server dies right after Vite says ready:

```
error: unexpected argument '--allow-scripts' found
Error: Could not establish a connection to the Netlify Edge Functions local development server
```

The template deploys the SSR handler as a Netlify Function, not an edge function, so the emulator
does nothing here. Setup passes `dev: { edgeFunctions: { enabled: false } }` to the plugin. Revisit
when `@netlify/edge-functions-dev` ships a release past 2.0.1.

## Build command and the Convex URL

`netlify.toml` runs `npx convex deploy --cmd '<pm> run build'`. Convex reads `CONVEX_DEPLOY_KEY`
from the environment, pushes the backend, and injects `VITE_CONVEX_URL` into the build it then
runs. Do not set that variable by hand in Netlify; a stale value points the client at the wrong
deployment. A **Production** deploy key deploys prod; a **Preview** key (separate credential
class) creates a preview deployment named after the branch. Set them under different contexts.

## The deploy key comes from the Convex CLI

`npx convex deployment token create <name> [--deployment prod] [--save-env [path]]` mints a
deployment-scoped deploy key and prints it to stdout (progress goes to stderr). It needs the
normal `convex login`, not a team token, and refuses only local and anonymous deployments.
Without `--deployment prod` it scopes to the deployment in `.env.local`, which is the dev one.
`npx convex deployment token delete <name>` revokes it. Pipe it straight into
`netlify env:set`; never print it. The **Preview** key is project-level and is the one class
the CLI does not mint; it stays a dashboard step (project Settings → Generate Preview Deploy
Key). Convex's Netlify guide (docs.convex.dev/production/hosting/netlify) puts the prod key on
the `production` context and the preview key on Deploy Previews; a preview key is accepted in
every Netlify context (the CLI only refuses a *prod* key in a non-production context), so
"previews only" means setting it on `production` too. The CLI names the preview deployment
after Netlify's `HEAD` variable, the branch, and reads `CONTEXT !== "production"` as non-prod.
Preview backends are fresh: no data, no environment variables. Project default environment
variables fill the latter: `npx convex env default set --type preview NAME 'value'` (also
`--from-file <.env>`, `list`, `remove`; `--type dev|preview|prod`). `--preview-run <function>`
on the build command seeds data and is ignored on production deploys.

## WorkOS URLs per context

`convex.json` `authKit.preview` and `authKit.prod` take `${buildEnv.X}`. Netlify's `URL` is the
production site URL and `DEPLOY_PRIME_URL` is the URL of the deploy being built; both include
`https://`, so do not prefix them (Vercel's variables are bare hosts, which is why the shipped
block prefixes them). ⚠️ Not exercised on a real Netlify build here.

`WORKOS_REDIRECT_URI` at runtime must match a registered URI exactly. Production is fixed
(`https://<site>.netlify.app/callback`); deploy previews have a different URL per deploy, so
either register a wildcard-free list per branch or leave previews unauthenticated for now.

## Vercel remnants

Delete `vercel.json` when choosing Netlify. Two build commands in one repo is how the wrong one
runs in CI.
