---
name: setup-project
description: "One-time repo setup: project config, dependencies, and the service stack (Convex, WorkOS, optional PostHog). Run once per repo before anything else. Re-run with verify for the 15 install health checks, or stack to redo the services."
disable-model-invocation: true
---

Get this repo from a fresh clone to a working install, then prove it works.

Run once per repo. Afterwards edit `.claude/project-config.md` directly — re-run only to start
over, with `verify` to health-check an install, or with `stack` to redo the services.

Read the argument the user invoked this with:

- `verify` → run **Part D only** (health checks)
- `stack` → run **Part C only** (services)
- no argument → run A, B, C. **Stop after Part C.** Do not run Part D.

Paths written as `references/…` below are relative to this skill's own folder.

## The rule for every step below

**🧑 marks a step only a human can do** — creating an account, copying a key out of a dashboard,
approving a browser prompt. Never pretend to have done one. Print the instruction, say plainly
that you cannot do it, and wait for the user to confirm before continuing.

Everything else you run yourself.

## The rule for everything you print

This skill runs long and does a lot. What reaches the user is four blocks and nothing else: the
questions, Step 4's receipt, the 🧑 lines still owed, and the completion block. Everything in
between is work, not output.

- **Do not narrate a part you just finished.** No "Part B done", no summary of what `npm ci`
  installed, no recap of the commit-hook divergences, no list of the env shape checks that passed.
  A step that worked produces silence. Only a step that *failed* or that still needs a human
  produces a line.
- **Never volunteer a fix the user did not ask for.** Not `engines`, not `packageManager`, not an
  `npm audit` summary, not a lockfile opinion. You will notice things — noticing is not a reason
  to speak. If it matters they will ask.
- **Nothing follows the completion block.** Not an afterthought, not "also noted", not an offer.
  It is the last thing in the turn.

If you are about to type a paragraph explaining what you did, delete it. The user can read the
files.

---

# Part A — Configure

## Step 0 — Check the install, then start the slow work

Nothing else in this skill works on a clone that has never been installed: the hooks shell out to
`tsx`, and every service check below needs `node_modules/`. So this is the first thing, before
any other question, and it is one shell line, not a sub-agent:

```bash
ls node_modules/.bin/tsx >/dev/null 2>&1 && echo installed || echo "not installed"
ls pnpm-lock.yaml package-lock.json bun.lock bun.lockb yarn.lock 2>/dev/null
```

**Decide the package manager here.** A fresh clone carries the *template's* lockfile, which says
nothing about what this person uses, so on a first run (no `.claude/project-config.json`) ask:

> Which package manager do you use? *(the repo ships **<manager from the lockfile>**; picking
> another one replaces the lockfile and the CI step)*
>
> npm · pnpm · bun · yarn

On a re-run, `pm` is already in `project-config.json`; state it and do not ask. Record the
answer as `pm` for Part A Step 3. The manager is a property of the repo, not a preference: two
people on one lockfile cannot each pick their own installer. A bun user on a pnpm repo runs
`bun run <script>` as a runner and never `bun install`.

The command shapes each manager needs. These go into `CLAUDE.md` in Step 3 and are what every
command and agent reads from there:

| | npm | pnpm | bun | yarn |
|---|---|---|---|---|
| install | `npm ci` | `pnpm install --frozen-lockfile` | `bun install --frozen-lockfile` | `yarn install --frozen-lockfile` |
| one test file | `npm test -- <path>` | `pnpm test <path>` | `bun run test <path>` | `yarn test <path>` |
| script | `npm run <s>` | `pnpm run <s>` | `bun run <s>` | `yarn run <s>` |
| one-off binary | `npx <bin>` | `pnpm exec <bin>` | `bunx <bin>` | `yarn exec <bin>` |

Never bare `bun test`: that is bun's own runner, not Vitest.

**Then start the install and the CLI downloads in the background**, with the Bash tool's
`run_in_background`, and go straight on to Step 1 while they run. They take longer than every
question below combined and none of them depend on an answer. If the chosen manager differs from
the lockfile, run only the `chmod` line now and let Part B do the switch first.

```bash
mkdir -p .claude/state/setup && {
  chmod +x .claude/hooks/*.sh
  <install command from the table above> 2>&1
  npx --no-install tsx --version 2>&1          # warms the hook runtime
  npx -y workos@latest --version 2>&1          # warms the WorkOS CLI download
  npx convex env list 2>&1 | grep -E '^(WORKOS_CLIENT_ID|WORKOS_API_KEY)=' | sed -E 's/=.*/=set/'
} > .claude/state/setup/warmup.log
```

Do not spawn a sub-agent for this or for Step 1: the check is two `ls` calls, the explore is five
file reads, and the warm-up is a shell job. A sub-agent costs its own system prompt and returns
nothing a log file does not.

## Step 1 — Explore

Read before assuming:

- `git remote -v`, and the current branch name (a `username/ID-title` shape hints at Linear)
- `CLAUDE.md` — is there a `## Project config` block already
- `.claude/project-config.md` — has this been run before?
- `vault/` — does `vault/project/` already hold `SPEC.md` / `ROADMAP.md`?
- `.claude/project-config.json` — current workflow switches, if any
- `vault/_glossary.md` and `vault/project/decisions/` — do the domain docs already exist?
- `docs/agents/` — did `mattpocock-skills` set this repo up? Its `code-review` skill reads
  `docs/agents/issue-tracker.md` by that exact path
- `package.json` — scripts, and which lockfile is present

## Step 2 — Ask once, then stop asking

Put every unsettled section into a **single question form** — one pass, one submit. Lead each with
the recommended answer so it can be accepted in a word.

Skip any section exploration already settled, and do not ask it. Note the skip in Step 4's one
line, not here.

### Section A — Issue tracker

> Where do tickets live? *(recommended: **Linear**)*
>
> - **Linear** — via the Linear MCP; `/linear` mirrors issues into the vault. Needs a team key.
> - **Local markdown** — files under `vault/project/in-progress/`, for a repo with no tracker
> - **GitHub Issues** — via the `gh` CLI. Only if the team already runs on it.

Linear is always the recommended option and always listed first; local markdown second; GitHub
Issues last. A GitHub remote is not a reason to recommend GitHub Issues: every repo has one, and
the workflow (`/linear`, `/roadmap`, the vault mirror) is built around Linear. Never mark GitHub
Issues as recommended.

**The answer is a file, not prose you write.** Each choice has a seed template in
`references/`: `tracker-linear.md`, `tracker-github.md`, `tracker-local.md`.
Copy the part below the `---` into the config file and fill in the team key or repo. Do not
compose this section from scratch.

### Section B — Planning docs

> Where do SPEC and ROADMAP live? *(recommended: **`vault/project/`**)*

They are facts about the project, so they belong in the vault beside the feature docs. Ask only if
the repo has no `vault/`.

### Section C — Workflow switches

(The package manager was decided in Step 0; it is not a question here.)


Four switches, one question each, all written to `.claude/project-config.json`:

> **TDD** — how strict? *(recommended: **auto**)* · `auto`: every feature/bug starts with
> `/generate-tests`, tests must fail first · `ask`: offered after the gate · `disabled`: no test step
>
> **Autonomy** — who drives after the gate? *(recommended: **guided**)* · `guided`: `/feature` and
> `/bug` show the G/T/I/H/P menu and wait · `agent`: they hand straight off to dev-agent
>
> **Docs** — keep project docs in the vault? *(recommended: **full**)* · `full`: feature docs,
> `/feature-sync`, `/vault`, `/meeting` on · `off`: those steps are skipped (SPEC and ROADMAP still write)
>
> **Worktrees** — run several dev-agents at once? *(recommended: **off** until autonomy is
> `agent`)* · `on`: each `/dev` hand-off gets its own branch and checkout, so two agents can work
> in parallel without touching each other's files · `off`: one hand-off at a time, in this checkout

If `package.json` has no test script, say so and recommend `ask` until a harness exists. Recommend
`agent` autonomy only if they say they want the sub-agent flow; it skips every human checkpoint
between the gate and the review.

### Section D — Project summary

> In one or two sentences: what does this project do, and who is it for?

Ask this whenever `CLAUDE.md` still holds the "Not filled in yet" placeholder. **Ask it on its
own, after the switches, never in the same form as them**: a form submitted early drops it, and a
run that ends with the placeholder still in place has failed this section. If the answer comes
back empty, ask once more at the end of Part A before writing. **Free text only — do not offer
drafted options.** The person running this has just cloned the template to build
their own product, and nothing in the repo yet says what that product is. Describing the repo as
"a starter template", "a testbed", or anything about the devkit is always wrong; only the user
knows the answer. Their reply replaces that block verbatim under `## Project summary`; do not pad
it.

### Section E — Domain docs

> Where do vocabulary and decisions live? *(recommended: **the vault**)*

Ask only if the repo has no `vault/`. Otherwise write it and say you skipped the question.

This is the section that stops every skill inventing its own word for the same concept. Copy the
body of `references/domain-docs.md` — it names `vault/_glossary.md` and
`vault/project/decisions/`, and carries the three rules that matter: use the glossary's word, a
missing entry is a signal rather than an error, and a contradicted ADR is surfaced, never
silently overridden.

## Step 3 — Write, then report

**Gate: the Section D answer must be in hand before any file is written.** If it is not (the
form dropped it, the reply was empty, you never asked), ask it now, alone, and wait. If the
person declines a second time, that is their call: write everything else, leave the placeholder,
and put `project summary` on the `Still owed` line. Three test runs in a row wrote every other
file and left the placeholder in `CLAUDE.md`; the summary is the one line a person cannot
reconstruct later from the repo.

**Write the files. Do not show drafts first.** Step 2 already confirmed every answer one at a
time; a second approval pass asks the same person the same questions twice, and the output is a
config file they have never seen before, so they have nothing to judge it against. It is a
markdown file in a git repo — wrong is cheap to fix, and the report below tells them where.

`.claude/project-config.md`:

```markdown
---
tags: [config]
_verified: <today>
---

# Project config

Read by `/linear`, `/feature`, `/bug`, `/spec`, `/roadmap`. Edit this file directly rather than
re-running `/setup-project`.

## Issue tracker

**<Linear | Local markdown | GitHub Issues>**

<The body of `references/tracker-<choice>.md`, below its `---`, with the
team key or repo filled in. Copied, not written.>

## Planning docs

- Spec: `<path>` · Roadmap: `<path>`
- Feature docs: `vault/project/features/<name>.md` · In-flight: `vault/project/in-progress/`
- Diagrams, flows, reports: `vault/project/docs/`

## Domain docs

<The body of `references/domain-docs.md`, below its `---`. Copied, not written.>

## Stack

Package manager: `<npm | pnpm | bun | yarn>` · Services: `<Convex, WorkOS, +PostHog?>` · Deployment: `<Netlify | Vercel | none yet>` · Site WorkOS environment: `<Production | Staging | n/a>`

## Workflow

tdd `<auto | ask | disabled>` · autonomy `<guided | agent>` · docs `<full | off>` · worktrees `<off | on>`
— canonical source is `.claude/project-config.json`; change with `/config`.
```

**Write what the answer is, not an explanation of it.** The seed templates exist because an open
placeholder gets padded until it looks complete — six bullets explaining what a folder is. If you
find yourself composing this section rather than copying it, you have the wrong file open.

Then add or update `## Project config` in `CLAUDE.md`, one line per heading, pointing at the
file. `CLAUDE.md` is the only project-memory file this devkit writes; never create `AGENTS.md`.

Write the switches and the package manager to `.claude/project-config.json` — that file, **not**
the config doc, is what the `skill-activation-prompt` hook and the commands read:

```json
{ "pm": "npm", "tdd": "auto", "autonomy": "guided", "docs": "full", "worktrees": "off" }
```

Then rewrite the first bullet of `## Working here` in `CLAUDE.md` (the one that starts
`Package manager is`) with the chosen manager and its five commands from the Step 0 table:
one test file, lint, gen, dev, check:devkit. Every command and agent takes its test and lint
commands from that bullet, so it must name real commands, not `<pm>`.

Then replace the `## Project summary` placeholder in `CLAUDE.md` with the Section D answer.

## Step 4 — Report what you wrote

One block, then move on to Part B. No preamble, no restating the file.

```
✅ Wrote .claude/project-config.md and CLAUDE.md § Project config

  Tracker   <answer>
  Planning  <spec path> · <roadmap path>
  Stack     <pm> · <services>
  Workflow  tdd=<mode> · autonomy=<value> · docs=<value> · worktrees=<value>
  Summary   <written | still the placeholder>

Wrong? Edit .claude/project-config.md directly — no need to re-run setup.
```

If you had to make a call the user did not make — skipping a section because the repo settled
it, picking a default they never named — add **one line** under the block, one clause, under
twenty words. Not a section, and not two clauses joined by "and". If it will not fit, it is two
decisions and only the surprising one is worth printing.

---

# Part B — Dependencies

## Step 1 — Detect the package manager. Do not assume.

The answer is `pm` in `.claude/project-config.json`, decided in Part A Step 0.

**Never run a package manager that doesn't match the lockfile** — it rewrites the lockfile and
produces a diff nobody asked for.

**If the user chose a manager other than the lockfile's in Step 0**, make the repo agree before installing:

1. Delete the old lockfile (`git rm`), keep `node_modules/` out of the way (`rm -rf node_modules`).
2. Run the new manager's plain install once (no `--frozen-lockfile`; there is no lockfile yet).
3. Set `"packageManager"` in `package.json` to `<pm>@<installed version>` so corepack and CI
   agree with the lockfile.
4. In `.github/workflows/ci.yml`, change the `cache:` value and every install/run line to the new
   manager's shape. For pnpm add the `pnpm/action-setup` step before `setup-node`; for bun use
   `oven-sh/setup-bun` instead of `setup-node`'s cache.
5. Report every file you changed in Step 4's report.

If nothing switched and `package.json` declares neither `engines` nor `packageManager`, note it
and move on. **Do not raise it.**

## Step 2 — Install

The install already ran in the background from Part A Step 0. Read `.claude/state/setup/warmup.log`
(wait for the task if it has not finished). If the package manager it used does not match the
lockfile from Step 1, run the right one now. Report failures verbatim; do not paper over them.

## Step 3 — Warm the hooks

The hook wrappers shell out to `npx tsx`, which fetches on first use. Make them executable and warm
the cache so the first real prompt isn't slow or broken:

```bash
chmod +x .claude/hooks/*.sh
```

## Step 4 — Install the commit-msg hook 🧑-adjacent

Git hooks are not versioned, so **no clone ever has this**. Run it:

```bash
cp .claude/git-hooks/commit-msg .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
```

Then test it both ways — a valid `feat(scope): subject` passes, `bad message` is rejected. A hook
you installed but never tested is not evidence of anything.

The hook diverges from Conventional Commits in three ways, which is why the test matters:
**scopes must be lowercase**, the breaking-change `!` marker is **rejected** (use a
`BREAKING CHANGE:` footer), and only the seven Angular types are allowed — `build`, `ci` and
`perf` are not among them. This is context for you, not a report for the user. Do not print it.

---

# Part C — The service stack

Each step below is the short path. The traps sit one level down in
`references/service-{convex,workos,posthog}.md` — **read the file for a
service before you touch its keys**, and again if a step fails.

Full API surface, recipes and agent-readiness ratings live in the vault at
`vault/tech/{convex,workos,posthog}/agent-surface.md`.

## Step 0 — Detect before asking

Run the checks, print the table, and then walk **only the rows marked ✗**. Nothing in this step
prompts the user, and nothing prints a key value. The CLI downloads were warmed in Part A Step 0,
so these return in seconds.

```bash
[ -f .env.local ] || cp .env.local.example .env.local
grep -E '^(CONVEX_DEPLOYMENT|VITE_CONVEX_URL|VITE_CONVEX_SITE_URL|WORKOS_CLIENT_ID|WORKOS_API_KEY|WORKOS_COOKIE_PASSWORD|WORKOS_REDIRECT_URI|VITE_POSTHOG_API_KEY)=' .env.local \
  | sed -E 's/=(.*your[_-].*|)$/=PLACEHOLDER/; s/=.+[^R]$/=set/'
npx convex env list 2>&1 | grep -E '^(WORKOS_CLIENT_ID|WORKOS_API_KEY)=' | sed -E 's/=.*/=set/'
npx workos@latest auth status --json --mode agent 2>/dev/null
npx workos@latest doctor --skip-ai --json --mode agent 2>/dev/null
```

| Check | ✓ when |
|---|---|
| Convex deployment | `CONVEX_DEPLOYMENT` set and `npx convex env list` returns without error. An access error with the variable set means the deployment belongs to another account: ✗ |
| Convex URLs | `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` are not placeholders |
| WorkOS keys, local | `WORKOS_CLIENT_ID` and `WORKOS_API_KEY` are not placeholders |
| WorkOS keys, deployment | both appear in `npx convex env list` |
| Cookie password | `WORKOS_COOKIE_PASSWORD` is set and not the placeholder |
| Redirect URI registered | `doctor` reports the callback URI, or the Convex-managed path provisioned it |
| PostHog | `VITE_POSTHOG_API_KEY` starts with `phc_` — optional, ✗ here means "not configured", not "missing" |
| Deployment | `netlify.toml` exists and `npx netlify status` shows a linked site, or `vercel.json` exists — optional, ✗ means "not configured" |

All ✓ → say so in one line and skip to Step 5. Otherwise fix the ✗ rows in the order below.
`.env.local` is gitignored; keep it that way, and **never print a real key** back to the user or
into a file you commit.

## Step 1 — Convex *(required)*

Skip if the deployment row is ✓.

**`npx convex dev` is interactive, and the Bash tool has no terminal to answer it.** Run bare, it
asks what to configure, which team, the project name, cloud or local, and whether to install AI
files, and a tool call hangs or dies on the first one. Every one of those prompts has a flag, so
the only step that needs a person is the browser login.

1. **Login.** `npx convex login status 2>&1` lists the teams the token can see. If it reports no
   login, 🧑 the user runs the login in their own terminal, because device authorization needs
   a browser and a TTY; tell them to type `! npx convex login`. Never run `login` from the Bash
   tool.
2. **Ask once:** which team (offer the slugs from `login status`; skip the question if there is
   one), whether this is a new project or an existing one, and the project name (default: the
   repo folder name).
3. **Configure without prompts:**
   ```bash
   npx convex dev --once --configure new --team <team_slug> --project <name> --dev-deployment cloud
   ```
   `--configure existing` with the same flags attaches to a project that already exists. This
   writes `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` to `.env.local` and
   pushes the functions once. The AI-files prompt is already answered by `convex.json`
   (`aiFiles.enabled: false`); if the command still stops on a question, it is not in a TTY: 🧑
   the user runs the same line with `!` in front and answers No.
4. **"You don't have access to the selected project"** means `.env.local` carries a
   `CONVEX_DEPLOYMENT` from another account or team. Step 3 overwrites it; do not ask the user
   to edit the file by hand.
5. Re-run the Step 0 grep. `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL`
   must now be set.

Env var shapes, the logs flag, and the CI deploy key: `references/service-convex.md`.

## Step 2 — WorkOS AuthKit *(required)*

Skip if every WorkOS row is ✓. Otherwise ask one question and take **one** path; they do not mix:

> **WorkOS.** Do you already have a WorkOS account, meaning you can sign in at
> dashboard.workos.com?
>
> - **Yes, and a new environment is fine** *(recommended)* → the WorkOS CLI creates a fresh
>   environment and gives me the keys. You do: sign in twice in the browser, once to claim the
>   environment into your account, once to log the CLI in. You copy: nothing.
> - **Yes, and it must use an environment that already exists** → you pick it from a list. You
>   do: sign the CLI in once, then copy that environment's API key from
>   https://dashboard.workos.com/get-started into `.env.local`. You copy: one key. Everything
>   else is done for you.
> - **No, I have never signed up** → Convex creates a WorkOS account and environment for you.
>   You do: answer yes to two prompts. You copy: nothing. Browser: none.
>
> If a previous `npx convex dev` ended with "A WorkOS account already exists with the email",
> your answer is yes.

Ask this **on its own**, not in the same form as other questions; each answer changes what
happens next, and a form submitted early loses it. Present the options in that order: most people
running this already have an account. The paths below keep their letters: first option → B,
second → C, third → A.

*Why "yes" rules out A:* WorkOS keys accounts by email, and Convex provisions by creating a
**new** WorkOS account owned by the Convex user's email. It cannot create a team inside an
account it does not own, so an existing account makes it re-ask *"Create a new WorkOS team with
this email address?"* forever; the only exit is 🧑 `cancel`, after which `dev` exits 1. If that
already happened, the answer is yes. The link is per Convex team and happens once: after any
admin whose email has no WorkOS account answers yes, every member's `npx convex dev` provisions
into that team regardless of email. Mention that once; do not make the user chase it today.

**Path A — Convex-managed.** `convex.json` carries an `authKit` block, so the `npx convex dev
--once` from Step 1 offers to create a WorkOS team for the Convex team. Answer yes to its prompts.
It creates the environment, registers the redirect URI and CORS origin from the `configure`
block, writes `WORKOS_CLIENT_ID`, `WORKOS_API_KEY` and `WORKOS_REDIRECT_URI` into `.env.local`,
and sets the two keys on the deployment. Re-run Step 0 to confirm.

**Path B — CLI-provisioned, then claimed.** No login needed for the first command:

```bash
npx workos@latest env provision --json --mode agent
```

It returns `apiKey`, `clientId` and `authkitDomain` and stores the environment locally as
unclaimed. Write `WORKOS_CLIENT_ID` and `WORKOS_API_KEY` into `.env.local` from that JSON without
echoing them, then:

1. 🧑 `npx workos@latest env claim` — opens the browser; the user signs in with their **existing**
   WorkOS account and the environment becomes theirs. Tell them first: this is permanent, and the
   claim token is lost if the local CLI config is deleted before claiming.
2. 🧑 `npx workos@latest auth login` — one browser step; stored in the keychain.
3. Register the callback (needs the login from step 2):
   ```bash
   npx workos@latest authkit redirect-uris set --uri http://localhost:3000/callback --default http://localhost:3000/callback --mode agent
   npx workos@latest authkit cors set --origin http://localhost:3000 --mode agent
   ```

**Path C — a specific existing environment.**

1. 🧑 `npx workos@latest auth login`.
2. `npx workos@latest environment list --json` → ask which one; then
   `npx workos@latest environment use <id>`.
3. `npx workos@latest whoami --json` → `environment.clientId` is `WORKOS_CLIENT_ID`. Write it.
4. 🧑 The API key. No CLI command prints an existing environment's `sk_test_...`; the user copies
   it into `.env.local`. Always give this link, it shows the key for the selected environment
   without navigating: https://dashboard.workos.com/get-started. Say which environment must be
   selected in the dashboard's environment switcher (the one from step 2). This is the only copy
   step on any path. Note whether it is a staging or production key; they are separate
   environments with separate data.
5. Register the callback with the same two `authkit` commands as path B step 3.

**Paths B and C then finish with:**

```bash
npx convex env set WORKOS_CLIENT_ID "$(grep '^WORKOS_CLIENT_ID=' .env.local | cut -d= -f2-)"
npx convex env set WORKOS_API_KEY  "$(grep '^WORKOS_API_KEY=' .env.local | cut -d= -f2-)"
```

Both places, every time. `convex/auth.config.ts` reads `process.env.WORKOS_CLIENT_ID` and that
code runs *on the deployment*, not on your machine; `.env.local` alone leaves it undefined and
every authenticated Convex call fails against a malformed JWKS URL.

**All paths:** if the cookie-password row is ✗, generate it and write it in:

```bash
openssl rand -base64 32
```

`WORKOS_REDIRECT_URI` is `http://localhost:3000/callback`. **A mismatch between that value and
the registered URI is the most common setup failure**, and the error at the callback does not
name the URI.

## Step 3 — Prove WorkOS is wired

```bash
npx convex env list | grep -cE '^WORKOS_(CLIENT_ID|API_KEY)='   # expect 2
npx workos@latest doctor --skip-ai --mode agent
```

Read the `Auth Methods` line of the `doctor` output. `None configured` means sign-in has
nothing to sign in with, and no CLI command turns one on: 🧑 dashboard → Authentication →
enable Email + Password or Magic Auth for the selected environment. Put it on the `Still owed`
line, not in a footnote at the end.

Fix anything else `doctor` flags before moving on. If the user wants proof beyond static checks,
`npx workos@latest verify-login` runs the login loop end to end with a throwaway user it deletes
afterwards; it refuses production keys. Offer it, do not run it unasked.

Why each of these bites: `references/service-workos.md`.

## Step 4 — PostHog *(optional — ask, unless it is already configured)*

**Check `.env.local` first.** If `VITE_POSTHOG_API_KEY` already holds a `phc_` value, PostHog is
already set up — do not ask, and do not recommend skipping something that works. Record it as
in-use, keep its block in `## Stack notes`, and say so in one line. Only ask when the key is
absent or still a placeholder.

> Set up PostHog for analytics, feature flags and session replay? *(recommended: **skip for now**)*
>
> - **Yes** — you get product analytics, flags and replay
> - **No** — the app runs fine without it; `VITE_POSTHOG_API_KEY` stays empty and analytics is
>   inert. Add it later by re-running `/setup-project stack`

Recommend skipping on a fresh setup: it is genuinely optional here, and one less 🧑 step between
the user and a running app.

**If they say yes, read `references/service-posthog.md` before touching
`.env.local`.** It carries the `phc_` vs `phx_` key trap and the region/host pairing. Both fail
silently — the wrong host returns empty results rather than an error.

## Step 5 — Deployment *(optional — ask, unless already configured)*

The template ships `vercel.json` (build command `npx convex deploy --cmd '<pm> run build'`) and
`convex.json` preview/prod blocks that read Vercel's build variables. Ask once:

> **Deployment.** Where will this project deploy? *(recommended: **not yet** on a first setup)*
>
> - **Netlify** → the CLI creates the site, links it, mints the Convex deploy key, and sets
>   the env vars. You do: sign the Netlify CLI in once. You copy: nothing.
> - **Vercel** → keep the shipped `vercel.json`; nothing to do now.
> - **Not yet** → skip. Re-run `/setup-project stack` when it is time.

**Netlify path.** Read `references/service-netlify.md` first (the long-form note with the
Convex docs links is `vault/tech/convex/hosting/netlify.md`); it carries the exit-code contract
and the commands that hang.

1. Install the adapter and the CLI, pinned:
   ```bash
   <pm> add -D @netlify/vite-plugin-tanstack-start netlify-cli
   ```
   Under pnpm 10, `netlify-cli` needs `pnpm approve-builds` once for `sharp`; say so if the
   install warns.
2. Wire the adapter: in `vite.config.ts` add `import netlify from '@netlify/vite-plugin-tanstack-start'`
   and, **after** `tanstackStart()` in `plugins`:
   ```ts
   netlify({ dev: { edgeFunctions: { enabled: false } } }),
   ```
   The option turns off the edge-functions emulator in `vite dev`. The template has no edge
   functions, and the emulator starts Deno with a flag Deno 2.9 rejects, which crashes `dev` a
   few seconds after Vite reports ready (`unexpected argument '--allow-scripts'`). Write
   `netlify.toml`:
   ```toml
   [build]
   command = "npx convex deploy --cmd '<pm> run build'"
   publish = "dist/client"
   ```
   Delete `vercel.json`, and in `convex.json` change the `preview` and `prod` blocks to Netlify's
   variables, which already carry the scheme:
   `redirectUris: ["${buildEnv.DEPLOY_PRIME_URL}/callback"]`, `corsOrigins: ["${buildEnv.DEPLOY_PRIME_URL}"]`
   for preview; `${buildEnv.URL}` in the same three places for prod. ⚠️ The Convex docs show only
   the Vercel names; the Netlify names follow the same `${buildEnv.X}` rule but have not been
   exercised here. Say so in the report.
3. 🧑 `npx netlify login` in the user's own terminal (`! npx netlify login`); it opens a browser
   and persists a token. Never run it from the Bash tool: exit code 4 means the command wanted a
   person. Confirm with `npx netlify status`.
4. Create and link the site without prompts (bare `link` opens a picker):
   ```bash
   npx netlify api listAccountsForUser | grep -E '"slug"'      # pick the team slug
   npx netlify sites:create --name <repo-name> --account-slug <slug>
   npx netlify link --name <repo-name>
   ```
5. Which Convex deployment the site builds against. Ask this on its own, before minting any key:

   > **Convex target for Netlify.** Every Netlify build runs `npx convex deploy`, which pushes
   > the backend to the deployment its key names. Which setup?
   >
   > - **Production** *(recommended to start)* → main builds push the project's prod
   >   deployment. The CLI mints the key. You copy: nothing.
   > - **Production plus a preview per pull request** → main pushes prod; every PR build gets
   >   a fresh Convex backend named after its branch, deleted when idle. This is the pattern
   >   Convex documents for Netlify. You copy: one Preview deploy key from the Convex dashboard,
   >   the one key class the CLI does not mint.
   > - **Previews only** → every build, main included, gets its own preview backend; prod is
   >   never touched. You copy: the same one Preview key.
   > - **My dev deployment** → the site talks to the deployment in `.env.local`, which is
   >   overwritten every time you run `convex dev`. A demo, not a site. You copy: nothing.

   Then set the key. It never appears in a file or in the transcript.
   - Production key, for the first two options:
     ```bash
     npx netlify env:set CONVEX_DEPLOY_KEY "$(npx convex deployment token create netlify --deployment prod 2>/dev/null)" --context production
     ```
     `convex deploy` refuses a production key in a non-production build, so this key goes on
     the `production` context only.
   - Preview key, for the second and third options: 🧑 Convex dashboard → project →
     Settings → **Generate Preview Deploy Key**. The user pastes it into the terminal prompt
     you give them. Second option: `--context deploy-preview --context branch-deploy`. Third
     option: add `--context production` as well; the CLI accepts a preview key in every
     context.
     ```bash
     npx netlify env:set CONVEX_DEPLOY_KEY "<preview key>" --context deploy-preview --context branch-deploy
     ```
     The CLI names the preview backend after Netlify's `HEAD` (the branch); nothing to pass.
     A preview backend starts empty: no data and no Convex environment variables. WorkOS on
     path A is provisioned by the `convex.json` `authKit.preview` block, which reads
     `${buildEnv.DEPLOY_PRIME_URL}`. On paths B and C the backend reads `WORKOS_CLIENT_ID`
     (`convex/auth.config.ts`), so set the project defaults for preview deployments now, from
     the CLI, values never echoed:
     ```bash
     for v in WORKOS_CLIENT_ID WORKOS_API_KEY; do
       npx convex env default set --type preview "$v" "$(grep "^$v=" .env.local | cut -d= -f2-)"
     done
     ```
     Mention `--preview-run <function>` on the `netlify.toml` build command as the way to seed
     data; that is later work, not setup.
   - Dev deployment: the Production command without `--deployment prod`.

   Then the WorkOS environment for the site (paths B and C; path A provisions one per
   deployment). `.env.local` holds keys from a **sandbox** environment (`sk_test_`). Every WorkOS
   project has a Staging (sandbox) and a Production environment, with separate keys, separate
   users and lower limits on the sandbox. Copying `.env.local` to Netlify puts the site on
   staging, which is what the first testers did by accident. Ask:

   > **WorkOS environment for the deployed site.**
   >
   > - **Production** *(recommended for any site people sign into)* → the project's Production
   >   environment. You copy: its API key.
   > - **Staging, same as local** → the sandbox keys already in `.env.local`. A test site with
   >   sandbox limits. You copy: nothing.

   Production: `npx workos@latest environment list --json` → the entry with `"sandbox": false`
   in the same project as the active environment; `npx workos@latest environment use <id>`, then
   `npx workos@latest whoami --json` → `environment.clientId`. 🧑 The API key, from
   https://dashboard.workos.com/get-started with **Production** selected in the switcher; it
   starts `sk_live_`. It goes into the terminal prompt only, never into `.env.local`, which stays
   on staging for local dev. Set the same two values on the Convex deployment the site talks to,
   since `convex/auth.config.ts` reads them there: `npx convex env set --prod WORKOS_CLIENT_ID
   <id>` and the same for `WORKOS_API_KEY` (dev deployment option: without `--prod`). Preview
   backends keep the sandbox defaults set above. Leave the CLI pointed at Production until Step
   6 has registered the callback, then `environment use <staging id>` again.

   Then the WorkOS variables, on the same contexts as the key. Client ID and API key are the
   chosen environment's; on the Staging answer they come from `.env.local` like the cookie
   password:
   ```bash
   npx netlify env:set WORKOS_CLIENT_ID "<client id>" --context production
   npx netlify env:set WORKOS_API_KEY "<api key>" --context production
   npx netlify env:set WORKOS_COOKIE_PASSWORD "$(grep '^WORKOS_COOKIE_PASSWORD=' .env.local | cut -d= -f2-)" --context production
   npx netlify env:set WORKOS_REDIRECT_URI "https://<repo-name>.netlify.app/callback" --context production
   ```
   `VITE_CONVEX_URL` is not set by hand: `npx convex deploy --cmd` injects it into the build.
6. Register the production callback with WorkOS the same way as Step 2, in the environment
   chosen in Step 5 (path A does it from the `convex.json` prod block on the first production
   deploy; B and C use `npx workos@latest authkit redirect-uris set` with **both** the local and
   the production URI, since `set` replaces the list, and `authkit cors set` with the site
   origin).
7. First deploy, from the terminal, so the build log is visible:
   ```bash
   npx netlify deploy --prod --build --json
   ```
   Then confirm `npx netlify status` and add the site URL to the Step 7 report.
8. **Deploy on push.** Step 7 deployed what was on this machine, once. Netlify builds on every
   push only when the repo is linked, and that link needs two things no flag replaces: 🧑 the
   Netlify GitHub App installed for the org (once per org, from the dashboard), then 🧑
   `! npx netlify init` in the user's own terminal, choosing the existing site; it is a wizard.
   After that, pushes to the default branch deploy production and pull requests get deploy
   previews, which is where the preview deploy key from step 5 becomes worth setting. If the
   team would rather keep deploys in GitHub Actions, the alternative is a deploy job in
   `.github/workflows/ci.yml` running `npx netlify deploy --prod --build` with
   `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` and `CONVEX_DEPLOY_KEY` as repository secrets
   (`gh secret set`); that path loses Netlify's per-PR previews and is not scripted here.

**Vercel path.** Keep `vercel.json`. 🧑 The Vercel project is created by importing the repo in
the Vercel dashboard; set `CONVEX_DEPLOY_KEY` and the four `WORKOS_*` variables there. This path
is not scripted here; the Vercel CLI exists but this template has not been run through it.

## Step 6 — Record the stack traps in CLAUDE.md

**Copy `references/stack-notes.md`. Do not write this section.**

Open that file, take everything below its `---`, delete the blocks for services this project does
not use, and paste the rest into `CLAUDE.md` under `## Stack notes`. Nothing else changes.

What goes in `CLAUDE.md` is **traps only** — the handful of things that bite an agent before it
would think to open a doc. Everything else already lives in
`vault/tech/<service>/agent-surface.md`, which the agent reads when the task needs it. This
section is loaded on every task in the repo, including ones that never touch the backend, so each
line costs context forever.

Two failures to avoid, both seen in practice:

- **Do not compose this from memory.** If the seed file is missing, say so and skip the step. A
  model asked to write "the Convex notes" produces ninety plausible lines nobody verified.
- **Do not write anything you read out of `.env.local`** — not the key prefix, not the region, not
  staging-vs-production. `CLAUDE.md` is committed and nothing resyncs it, so it goes stale in
  silence and the agent believes it anyway.

## Step 7 — Prove it runs 🧑

```
<pm> run dev
```

**The user runs this, not you.** In this template `dev` is `convex dev --start "vite dev"` — it
watches and never exits, so running it yourself hangs the session.

Ask the user to run it and report back: does the app load, and does sign-in reach WorkOS? **If it
does not work, the setup is not done** — never report success on a green install with a broken
app.

---

# Part D — Verify, and fail loudly

**Only on `/setup-project verify`.** A plain run ends at Part C. These fifteen checks read most of
`.claude/` and `vault/`, and on a fresh clone of this template they pass by construction — running
them every time spends a lot of context to confirm what the template already guarantees. They earn
their cost when something has drifted, which is a thing you go looking for.

This system's defining weakness is that it fails *open*: a wrong path falls back to a default, an
unregistered skill never fires, and nothing says a word. These checks are the only thing between a
working install and one that quietly stopped running — run them after editing `.claude/`, after a
merge that touched skills or hooks, or when something stopped firing and you cannot say why.

## Run it in a sub-agent

The checks read a lot and conclude little, which is the shape a sub-agent is for. Dispatch one
`general-purpose` agent with the **Checks** list below pasted verbatim, and this instruction:

> Run every check from the repo root. Fix nothing. Return only the failures, each as: check
> number, what is wrong in one line, and the one command or edit that fixes it. End with
> `<N> passed, <M> failed`. Never print a value read from `.env.local`.

Print its result through the **Report** format. Checks 1, 7, 10 and 12 are cheap and you may run
them yourself while the agent works, but do not duplicate the rest in the main thread.

## Checks

**Config**
1. `.claude/project-config.json` exists with all five keys (`pm`, `tdd`, `autonomy`, `docs`, `worktrees`)
   and only allowed values.
2. `.claude/project-config.md` exists.

**Skills**
3. Every directory in `.claude/skills/` is registered in `skill-rules.json`. Unregistered = never
   activates, silently.
4. Every key in `skill-rules.json` has a matching directory.
5. No broken symlinks under `.claude/skills/`.
6. Every `vault/…` path named in a `SKILL.md` resolves. Two exclusions, both learned the hard way:
   **skip placeholders** (anything containing `<` or `>` is a pattern, not a path), and **skip
   files a command is supposed to create** — `vault/project/SPEC.md` and `ROADMAP.md` are absent
   until `/spec` and `/roadmap` run, and flagging them trains people to ignore the report.
   This check still catches the most rot.

**Hooks**
7. `node scripts/check-devkit.mjs` passes (vault links, `.claude/` paths, skill rules, hook scripts).
8. `.claude/hooks/*.sh` are executable.
9. Every hook path in `settings.json` exists on disk.
10. `.git/hooks/commit-msg` exists and is executable.

**Stack**
11. Lockfile matches the package manager in `packageManager` (or the one in use), and
    `node_modules/` exists.
12. `.env.local` exists and every non-optional key in `.env.local.example` has a non-placeholder
    value. **Report which keys are missing — never their values.**

**Consistency**
13. Rule IDs cited in the hook's injected block say the same thing as `vault/_conventions.md`.
    Report disagreements: the hook is what the model reads, so when they differ the rule index is
    decorative.
14. Every slash-invocation named in `CLAUDE.md` or a `SKILL.md` resolves to either
    `.claude/commands/<name>.md` **or** `.claude/skills/<name>/SKILL.md` — user-invocable skills
    are written with a leading slash too, so checking only the commands folder gives false
    failures. Ignore prose placeholders like "every /command named in…", and the two commands
    documented as deliberately absent: `/doctor` and `/setup-tests`.
15. Every `references/…` path named in a `SKILL.md` resolves against that skill's own folder.
    These are the seed templates and service notes a skill copies from; a dead one means the
    skill invents the content instead, which is the failure this layer exists to prevent.
16. `CLAUDE.md` does not contain `devkit:project-summary-placeholder`. If it does, Section D was
    dropped; report it as a failure, not as a note.

## Report

**Print failures only.** A table of fourteen green rows is noise; nobody reads it, and it buries
the one line that matters. Passing checks get a count, not a row each.

```
INSTALL CHECK — <N> passed, <M> failed

❌ <check name>
   <exactly what is wrong, one line>
   Fix: <the one command or edit>

🧑 Outstanding: <the human step still owed, if any>
<Decided for you: one sentence, only if a write was skipped or a default was picked. Omit it
entirely when neither happened — a run with nothing to declare prints no such line.>
```

**The block above is the whole output.** It ends where it ends. Nothing follows it — not an
`npm audit` summary, not a note about `engines` or `packageManager`, not "one thing I noticed",
not an offer to fix something you spotted. Those are separate asks the user has not made. If you
noticed something, hold it; they will ask.

On a clean run that is two lines:

```
INSTALL CHECK — 15 passed, 0 failed
🧑 Outstanding: run `npm run dev` and confirm the app loads and sign-in reaches WorkOS.
```

Rules for this block:

- **Never list a passing check.** If the user wants the full table they will ask.
- **One line of detail per failure**, plus one `Fix:` line. Quote the two conflicting values when
  a check found a disagreement; do not explain the rule.
- **Do not fix anything automatically.** A rule disagreement or a missing vault note is a
  decision, not a typo. State the two options and stop.
- **Count the lines before you send.** A clean run is two. A run with one failure is five. If
  what you are about to print is longer than the template, you added something the template does
  not have — delete it.

---

# On completion — recommend, do not run

A plain run reaches here from the end of **Part C**, not Part D.

This is the entire end of the run:

```
🧑 Still owed: <one line, only if something is>

✅ Setup complete. Next: /clear, then /spec — grills you on what this project must do and
   writes vault/project/SPEC.md. After that /roadmap turns it into phases.

   Clear first: this session is full of install and service output that /spec never reads.
   Everything it needs is on disk in .claude/project-config.md and CLAUDE.md.
```

The `🧑 Still owed` line appears only when something genuinely is — the app not yet run, a key
still missing, the project summary still a placeholder. Multiple items go on the **one** line,
separated by `·`. When nothing is owed, the block starts at ✅.

Nothing else. No summary of the run, no list of what passed, no "everything else is done", no
offer to fix something you noticed.

**Then stop and end the turn, whatever `autonomy` says.** Do not chain into `/spec` from this
session: the recommendation is to clear first, and a chain cannot cross a clear. Setup and the
spec share nothing except the files on disk, and a spec written on top of this session's context
pays for every install log again on every turn. `/spec` ends by recommending `/roadmap` the same
way; nothing in this chain starts the next command unasked.

## Related

- [Claude Setup](https://github.com/TwoTabs/devkit/wiki/Claude-Setup) — the operating manual this configures
- `references/` — tracker seed templates and per-service traps, in this folder
- `vault/tech/{convex,workos,posthog}/agent-surface.md` — full per-service depth
- `/spec` → `/roadmap` → `/linear` — the sequence this starts, each run by the user in a fresh session
- `/config` — change a workflow switch later without re-running setup
