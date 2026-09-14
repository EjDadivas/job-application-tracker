# Two Tabs Starter — TanStack + Convex + WorkOS

A full-stack starter template for [Two Tabs](https://twotabs.io) projects on our flagship stack, with
**PostHog** instrumentation and the Two Tabs **devkit** tooling bundle (Claude Code
skills/agents/commands + an Obsidian knowledge vault) baked in.

It ships **no domain of its own** — only a `/health` route that proves the stack is wired. Your first
feature is the first feature.

> **Use this template:** click **“Use this template” → Create a new repository** on GitHub, or
> `gh repo create my-app --template TwoTabs/template-tanstack-convex-authkit-posthog`. You get a clean
> copy with no git history — ready to `npm install` and go.

## Stack

- **[Convex](https://convex.dev)** — database, server functions, reactivity
- **[TanStack Start](https://tanstack.com/start)** — full-stack React with file-based routing + SSR
- **[React 19](https://react.dev)** + **[Tailwind CSS](https://tailwindcss.com)** — UI
- **[shadcn/ui](https://ui.shadcn.com)** — accessible Radix-based primitives, vendored into
  `src/components/ui/` so you own and edit them (`cn()` + Tailwind, never inline styles — rule F-09)
- **[WorkOS AuthKit](https://authkit.com)** — authentication
- **[PostHog](https://posthog.com)** — product analytics, error tracking, feature flags (optional)

## Setup

### Prerequisites

- **Node 22+** and npm (CI pins Node 22 — `node -v` to check)
- A **[WorkOS](https://dashboard.workos.com)** account — free, no card
- A **[Convex](https://dashboard.convex.dev)** account — free tier is plenty for dev
- _(Optional)_ a **[PostHog](https://app.posthog.com)** account — the app runs fine without one

Budget ~10 minutes end to end. Steps 2–4 are the only ones with any thinking in them.

### 1. Get the code and install

```bash
gh repo create my-app --template TwoTabs/template-tanstack-convex-authkit-posthog --private --clone
cd my-app
npm install

cp .env.local.example .env.local   # you'll fill this in as you go
```

No `gh` CLI? Clone directly and detach from the template's history:

```bash
git clone https://github.com/TwoTabs/template-tanstack-convex-authkit-posthog.git my-app
cd my-app
rm -rf .git && git init      # start your own history
npm install

cp .env.local.example .env.local
```

`.env.local` is gitignored — it holds real secrets and must never be committed.

### 2. WorkOS — create the app and copy two credentials

1. Sign in to the [WorkOS dashboard](https://dashboard.workos.com) and create (or pick) an environment.
   You'll be in **Staging** by default — that's the right one for local dev; production gets its own
   environment with its own keys later.
2. Open **API Keys** in the sidebar. Copy both into `.env.local`:
   - **Client ID** → `WORKOS_CLIENT_ID` (looks like `client_01H…`)
   - **Secret Key** → `WORKOS_API_KEY` (looks like `sk_test_…`) — reveal it once and store it; the
     dashboard won't show it again.
3. Open **Authentication** and enable at least one sign-in method (Email + Password is the fastest;
   Google OAuth and SSO also work with no code change).
4. **Redirect URI** — `npx convex dev` (step 4) registers `http://localhost:3000/callback` for you via the
   `authKit.dev.configure` block in `convex.json`. If you'd rather do it by hand, add it under
   **Redirects** → _Sign-in callback_, and set the app homepage to `http://localhost:3000`.

Leave `WORKOS_REDIRECT_URI=http://localhost:3000/callback` in `.env.local` as-is unless you change the port.

### 3. Generate the session cookie password

AuthKit uses a **sealed session**: the middleware encrypts the whole session (access token, refresh token,
user) into one cookie, and this value is the key it seals with. It's **required** — miss it, or go under 32
characters, and the app throws before the first render.

```bash
openssl rand -base64 32     # paste the output into WORKOS_COOKIE_PASSWORD
```

Use a **different** value per environment, and note that rotating it signs everyone out.

### 4. Convex — provision the deployment

```bash
npx convex dev
```

This one command logs you in via the browser, creates the dev deployment, writes `CONVEX_DEPLOYMENT` and
`VITE_CONVEX_URL` into `.env.local`, pushes your WorkOS credentials to the deployment, configures the
AuthKit redirect/CORS settings, and generates `convex/_generated/`. Leave it running — it hot-pushes
backend changes.

Confirm the backend got its credentials:

```bash
npx convex env list        # expect WORKOS_CLIENT_ID and WORKOS_API_KEY
```

### 5. PostHog (optional)

Skip this and the app works — with no key the provider is skipped and every PostHog call no-ops.

1. In [PostHog](https://app.posthog.com), go to **Settings → Project → Project ID/API key** and copy the
   **project API key** (`phc_…`) into `VITE_POSTHOG_API_KEY`.
2. Set `VITE_POSTHOG_HOST` to `https://us.i.posthog.com` or `https://eu.i.posthog.com` to match the region
   you signed up in.
3. Nothing else is required — the template gates no UI on a flag. Feature flags are documented in
   `vault/tech/posthog/`.

### 6. Run it

```bash
npm run dev        # convex dev + vite dev together
```

Open <http://localhost:3000>, sign up through AuthKit, and you should land back on the app signed in.

### 7. Check the stack

Open <http://localhost:3000/health>. A server timestamp means Convex is reachable and the function
deployed; the identity line flips from *signed out* to *signed in* once AuthKit has a session. If both
lines answer, the wiring is done and every remaining problem is yours.

Delete `convex/features/health/`, `convex/functions/health.ts` and `src/routes/health.tsx` once you have
real features to load instead.

## Environment variables

Everything lives in `.env.local` (copy from `.env.local.example`):

| Variable                 | Required | Where to get it                                                                                    |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| `WORKOS_CLIENT_ID`       | ✅       | WorkOS dashboard → **API Keys** → Client ID (`client_…`)                                           |
| `WORKOS_API_KEY`         | ✅       | WorkOS dashboard → **API Keys** → Secret Key (`sk_test_…`, shown once)                             |
| `WORKOS_COOKIE_PASSWORD` | ✅       | Generate: `openssl rand -base64 32` — **≥32 chars**, unique per environment                        |
| `WORKOS_REDIRECT_URI`    | ✅       | `http://localhost:3000/callback` for dev; your deployed origin + `/callback` otherwise             |
| `VITE_CONVEX_URL`        | ✅       | Written automatically by `npx convex dev` (`https://<name>.convex.cloud`)                          |
| `CONVEX_DEPLOYMENT`      | ✅       | Written automatically by `npx convex dev` — identifies the deployment to the CLI                   |
| `VITE_POSTHOG_API_KEY`   | —        | PostHog → **Settings → Project** → project API key (`phc_…`). Leave unset to run without analytics |
| `VITE_POSTHOG_HOST`      | —        | `https://us.i.posthog.com` (default) or `https://eu.i.posthog.com`                                 |

Anything prefixed `VITE_` is **inlined into the client bundle** — treat it as public. Both PostHog values
and the Convex URL are designed to be public; the WorkOS secret key and cookie password are not, which is
exactly why they carry no `VITE_` prefix. Never add one to them.

### The Convex backend needs its own env vars

`.env.local` only covers the **app** side. The Convex deployment is a separate runtime —
`convex/auth.config.ts` reads `WORKOS_CLIENT_ID` from _there_ to build the JWKS URL, and without it every
authenticated Convex call fails to verify its token:

```bash
npx convex env set WORKOS_CLIENT_ID <your_client_id>
npx convex env set WORKOS_API_KEY   <your_api_key>
```

For dev, `convex.json`'s `authKit.dev.localEnvVars` block pushes both from your `.env.local` when you run
`npx convex dev`, so this is usually already done — verify with `npx convex env list`. You **do** have to run
it by hand for any other deployment:

```bash
npx convex env set WORKOS_CLIENT_ID <your_client_id> --prod   # same for --preview-name <branch>
npx convex env set WORKOS_API_KEY   <your_api_key>   --prod
```

### Troubleshooting

| Symptom                                                   | Cause                                                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| App throws before rendering anything                      | `WORKOS_COOKIE_PASSWORD` missing or under 32 chars                                                        |
| `missing VITE_CONVEX_URL env var`                         | `npx convex dev` hasn't run, or you started Vite outside `npm run dev`                                    |
| Signed in on the client, but Convex queries act anonymous | `WORKOS_CLIENT_ID` not set **on the Convex deployment** — `npx convex env list`                           |
| Redirected to WorkOS and back to an error                 | Callback URL mismatch — `WORKOS_REDIRECT_URI` must equal the redirect registered in WorkOS, port included |
| A new route is missing from the router's types             | `src/routeTree.gen.ts` is stale — run `npm run gen` before `npm run lint`                                 |

## House patterns (what the conventions look like in code)

The template deliberately ships no reference feature — one always encodes somebody else's domain, and
every project's first job became deleting it. What is here instead:

- **The shape** — `convex/features/health/` is the smallest legal feature folder: `queries.public.ts`
  and `tests/`. A real feature adds `mutations.public.ts`, `ctx`-taking `helpers.ts`, pure `utils.ts`,
  `schema.ts`, and internal-only `mutations.ts`. Handlers stay thin and delegate to helpers; public and
  internal functions share helpers rather than duplicating logic (B-17).
- **The aggregator** — public functions reach the frontend through `convex/functions/<entity>.ts`, a
  pure re-export with no logic, so the frontend imports a flat `api.functions.<entity>.*` path (B-18).
- **The rules themselves** — `vault/_conventions.md` is the rule set, cited inline as `B-01`, `F-02`.
  Each row links to a vault note with the worked example.
- **Auth** — reads may be public (the documented B-05 exception); writes go through `requireAuth`
  (`convex/shared/auth.ts`). Errors carry a stable `code` that callers branch on, never a message
  (B-12).
- **Fixtures** — `convex/test.setup.ts` holds the identity fixtures the B-11 trio needs: a newcomer,
  an onboarding user, a member, and a second member for the cross-author test.

Ask Claude Code for `/feature` and it derives structure from these rather than from a sample entity.

## PostHog

PostHog is **optional** — with no `VITE_POSTHOG_API_KEY` the provider is skipped and every call no-ops.
Search the code for `// MARK: PostHog` to jump to each touch point:

- Provider + automatic error tracking (`PostHogErrorBoundary`) — `src/router.tsx`
- User identification / reset on sign-out — `src/lib/posthog.ts`, `src/routes/index.tsx`
- `usePostHogCapture()` — the seam for your own events. The template ships none.

Feature flags, session recording, experiments, multivariate flags and source maps are documented in
`vault/tech/posthog/`.

## The devkit bundle

This template bundles the Two Tabs devkit so a new project is fully tooled from commit one:

- `.claude/` — Claude Code skills, agents, slash commands, and hooks (`npm install` covers the hook runtime, `tsx`)
- `vault/` — an Obsidian knowledge base (`_index.md`, `_conventions.md`, `tech/`, `architecture/`)
- `CLAUDE.md` — project memory; **fill in the “Project summary” placeholder first**

The operating manual lives in the [devkit wiki](https://github.com/TwoTabs/devkit/wiki), not in this
repo: [Claude Setup](https://github.com/TwoTabs/devkit/wiki/Claude-Setup) for day one
(`/setup-project` → `/spec` → `/roadmap` → `/linear` → `/feature` or `/bug` → `/dev` → `/review`), and
[Driving Claude Code](https://github.com/TwoTabs/devkit/wiki/Driving-Claude-Code) once you are
building. It used to ship as three in-repo copies that drifted out of date; one home is the point.

The bundle is a **snapshot** of the [devkit](https://github.com/twotabs) at template-creation time. To pull
newer skills/docs later, re-copy from the devkit’s `templates/tanstack_convex_workos` overlay.

## Scripts

| Script           | Does                               |
| ---------------- | ---------------------------------- |
| `npm run dev`    | `convex dev` + `vite dev` together |
| `npm run build`  | Production build                   |
| `npm test`       | Vitest; `npm test -- <path>` for one file |
| `npm run lint`   | `tsc` typecheck + ESLint           |
| `npm run gen`    | Rebuild `src/routeTree.gen.ts` after route changes |
| `npm run format` | Prettier                           |
| `npm run check:devkit` | Validate vault links, `.claude/` paths, skill rules |

npm is the template default. `/setup-project` records the repo's manager as `pm` in `.claude/project-config.json` and rewrites the commands in CLAUDE.md for pnpm, bun or yarn.

## Deployment

`vercel.json` builds via `npx convex deploy --cmd 'npm run build'` — one command that pushes the backend and
builds the frontend against it. `convex.json` handles AuthKit redirect/CORS config per environment, so
preview and production callbacks are registered from your Vercel URLs automatically.

Going live is the setup above, once more, with production credentials:

1. **WorkOS** — switch to your **Production** environment and copy its own Client ID and Secret Key
   (staging keys will not work in prod).
2. **Vercel project → Settings → Environment Variables** — set `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`,
   `WORKOS_COOKIE_PASSWORD` (a **fresh** `openssl rand -base64 32`, not your dev one),
   `WORKOS_REDIRECT_URI` (`https://your-domain/callback`), plus `VITE_POSTHOG_API_KEY` /
   `VITE_POSTHOG_HOST` if you use PostHog. Add `CONVEX_DEPLOY_KEY` from the Convex dashboard
   (**Settings → Deploy keys**) so the build can push.
3. **Convex production deployment** — set its backend vars too; they don't come from Vercel:
   ```bash
   npx convex env set WORKOS_CLIENT_ID <prod_client_id> --prod
   npx convex env set WORKOS_API_KEY   <prod_api_key>   --prod
   ```
4. Deploy, then sign in once on the live URL to confirm the callback and token verification both work.

## Maintainers — publishing this as a template repo

Push to GitHub, then **Settings → General → check “Template repository.”** Consumers then get the
**“Use this template”** button (clean history, no LFS).

---

MIT © Two Tabs
