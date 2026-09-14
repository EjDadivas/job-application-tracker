# WorkOS AuthKit — traps and detail

Read when a Part C WorkOS step fails. Deeper notes: `vault/tech/workos/agent-surface.md`.

## Convex auto-provisioning dies on an existing WorkOS account

`convex.json` has an `authKit` block, so `npx convex dev` tries to create a WorkOS team for your
Convex team. If the email on the Convex account already has a WorkOS account, it can't:

```
A WorkOS account already exists with the email: <you>@<domain>
Create a new WorkOS team with this email address? (can't create, a WorkOS team already exists)
...
X Failed to provision WorkOS environment
error: script "dev" exited with code 1
```

The prompt re-offers the same failing choice, so it reads like a retry loop. It isn't recoverable —
🧑 pick `cancel (do not create a WorkOS account)` and bring your own credentials instead. Anyone
whose company already uses WorkOS is on this path by default.

## The keys go in two places, not one

`.env.local` covers the browser and the TanStack server. It does **not** reach the Convex
deployment, and `convex/auth.config.ts` reads `process.env.WORKOS_CLIENT_ID` there:

```ts
jwks: `https://api.workos.com/sso/jwks/${clientId}`,
```

With the deployment variable unset that interpolates to `.../jwks/undefined`, so token validation
fails on every authenticated call while the frontend looks signed in. Set both:

```bash
npx convex env set WORKOS_CLIENT_ID <client_...>
npx convex env set WORKOS_API_KEY <sk_test_...>
```

Confirm with `npx convex env list`. Successful auto-provisioning does this for you, which is why
the step is easy to miss on the bring-your-own path.

## Staging and production are separate environments

Separate keys, separate user data, and lower rate limits on staging. Every project has both:
`npx workos@latest environment list --json` shows `"sandbox": true` for Staging and `false` for
Production, and API keys start `sk_test_` or `sk_live_` to match. A key from the wrong environment
authenticates fine and then returns an empty user list, or hits the sandbox limits under real
traffic. `.env.local` is staging by design; the deployed site's keys are a separate answer in the
Netlify step, and the first testers shipped staging keys to the site because nothing asked.

## The redirect URI mismatch

**This is the most common setup failure here.** `WORKOS_REDIRECT_URI` in `.env.local` must match
the URI registered in the WorkOS dashboard character for character, including the port and the
absence of a trailing slash.

Local dev value: `http://localhost:3000/callback`, and the same string registered in WorkOS —
by the Convex-managed path automatically, or from the terminal with
`npx workos@latest authkit redirect-uris` after `npx workos@latest auth login`.

A mismatch fails at the callback with an error that does not name the URI, so check this before
debugging anything else.

## The cookie password is generated, not copied

`WORKOS_COOKIE_PASSWORD` must be **at least 32 characters**. Generate it:

```bash
openssl rand -base64 32
```

## The CLI exists, and older notes say it does not

`npx workos@latest` (v0.22 checked 12 Sep 2026). What each command needs and gives back, read
from the CLI source rather than the README, which lags:

| Command | Needs | Returns |
|---|---|---|
| `env provision --json` | nothing | `apiKey`, `clientId`, `authkitDomain`, `claimToken`; stored locally as unclaimed |
| `env claim` | browser | links the unclaimed env to the account you sign in with; permanent |
| `auth login` | browser, once | dashboard session in the keychain |
| `environment list --json` / `use <id>` | login | `id`, `name`, `sandbox`, `project` |
| `environment create --name <n> --sandbox` | login | `id`, `name`, `clientId`; **no API key** |
| `whoami --json` | login | `environment.clientId`, environment id |
| `authkit redirect-uris set --uri <u> --default <u>` | login | replaces the whole list |
| `authkit cors set --origin <o>` | login | replaces the whole list |
| `doctor --skip-ai` | nothing | diagnosis of the project |

No command prints an existing environment's API key. That copy is the one dashboard step on the
existing-environment path. Send the person to https://dashboard.workos.com/get-started; it shows
the API key and client ID for the environment selected in the switcher, with no navigating. Nested `--help` falls back to the top-level listing; use `<group>
--help` for the subcommand list.

## Keys from the dashboard

| Var | Shape |
|---|---|
| `WORKOS_API_KEY` | `sk_test_...` (secret, server-side only) |
| `WORKOS_CLIENT_ID` | `client_...` |
