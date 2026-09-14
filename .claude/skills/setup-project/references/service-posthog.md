# PostHog — traps and detail

PostHog is optional. Read this only if the user opts in. Deeper notes:
`vault/tech/posthog/agent-surface.md`.

## Two key types, and only one is safe in the browser

| Key | What it does | Where it may go |
|---|---|---|
| `phc_...` **project** | write-only ingestion, cannot read | safe in client code — this is what `VITE_POSTHOG_API_KEY` wants |
| `phx_...` **personal** | read and manage over the API | **server-side only** |

⚠️ **Never put a `phx_` key in a `VITE_`-prefixed variable.** Vite inlines those into the browser
bundle, and a personal key can read the whole analytics history.

If a read returns an auth error, check the key *prefix* before assuming the key is bad.

## Region is chosen once and fixes the host

🧑 Choosing US or EU cloud at project creation is not changeable later without moving data. Set
`VITE_POSTHOG_HOST` to match:

- US → `https://us.i.posthog.com`
- EU → `https://eu.i.posthog.com`

**Keys do not work across regions**, and the wrong host returns empty results rather than an
error, so this failure looks like "no data yet".
