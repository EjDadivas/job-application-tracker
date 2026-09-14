---
tags:
  - convex
  - netlify
  - deployment
  - preview-deployments
  - official-guidelines
source: https://docs.convex.dev/production/hosting/netlify
related-skill: convex
aliases: ["Convex on Netlify"]
---

# Convex on Netlify

> **Quick Summary**: Netlify builds run `npx convex deploy --cmd '<pm> run build'`. The deploy key in `CONVEX_DEPLOY_KEY` decides which Convex backend the build pushes to and points the client at: a production key on the `production` context, a preview key on `deploy-preview`. Each preview gets a fresh, empty backend named after its branch.

Source: [Using Convex with Netlify](https://docs.convex.dev/production/hosting/netlify). Preview deployments in depth: [Multiple deployments](https://docs.convex.dev/production/multiple-deployments#preview).

## How a build works

1. Netlify runs the build command from `netlify.toml`:
   ```toml
   [build]
   command = "npx convex deploy --cmd 'pnpm run build'"
   publish = "dist/client"
   ```
2. `npx convex deploy` reads `CONVEX_DEPLOY_KEY`, works out which deployment the key names, and sets `VITE_CONVEX_URL` in the environment of the `--cmd` it runs. Do not set that variable by hand in Netlify; a stale value points the client at the wrong backend. Use `--cmd-url-env-var-name` only if the variable name cannot be inferred.
3. The `--cmd` build (Vite plus `@netlify/vite-plugin-tanstack-start`, registered after `tanstackStart()` in `vite.config.ts`) bakes that URL into the client bundle.
4. `npx convex deploy` pushes functions, schema and indexes to that same deployment. If any step fails, the later ones do not run.

## Deploy keys and contexts

| Key class | Who mints it | Netlify context | Effect |
|---|---|---|---|
| Production | `npx convex deployment token create <name> --deployment prod` (needs `convex login`) | `production` only | pushes the project's prod deployment |
| Preview | Convex dashboard → project Settings → *Generate Preview Deploy Key* (no CLI mints it) | `deploy-preview`, `branch-deploy` | creates or updates a preview backend named after the branch |
| Deployment-scoped dev | `npx convex deployment token create <name>` with no flag | any | pushes the dev deployment in `.env.local`; a demo, overwritten by every `convex dev` |

The CLI refuses a production key when Netlify's `CONTEXT` is not `production`. A preview key is accepted in every context, so "previews only" means setting it on `production` too; main then gets a preview backend called `main` and prod is never touched.

Set a variable per context with the Netlify CLI; `--context` repeats:

```bash
npx netlify env:set CONVEX_DEPLOY_KEY "$(npx convex deployment token create netlify --deployment prod 2>/dev/null)" --context production
npx netlify env:set CONVEX_DEPLOY_KEY "<preview key>" --context deploy-preview --context branch-deploy
```

The production key never needs to be printed: the CLI writes it to stdout and progress to stderr, so the substitution above captures only the key. Revoke with `npx convex deployment token delete <name>`.

## Preview deployments

- The branch name comes from Netlify's `HEAD` variable; nothing to pass. `--preview-create <name>` overrides it, `--preview-name` targets an existing one.
- A preview backend is fresh: its own functions, data, crons and environment variables, shared with nothing.
- Environment variables the functions need (`WORKOS_CLIENT_ID` for `convex/auth.config.ts`, and whatever else the code reads) come from the project's *default environment variables* for preview deployments. Set them from the CLI: `npx convex env default set --type preview NAME 'value'`, or `--from-file .env.preview` for several at once; `npx convex env default list --type preview` shows them. A preview backend without them fails at the first authenticated call.
- Seed data with `--preview-run '<functionName>'` on the build command. It runs only on preview deploys and is ignored on production.
- Convex removes idle preview deployments; find live ones in the dashboard's deployment switcher.

## WorkOS per context

`convex.json` `authKit.preview` and `authKit.prod` take `${buildEnv.X}` values that `convex deploy` reads from the build environment. On Netlify, `URL` is the production site URL and `DEPLOY_PRIME_URL` is the URL of the deploy being built; both include the scheme, so they are used bare, unlike Vercel's host-only variables. The `authKit.preview` block registers each preview's callback URL when the deploy provisions AuthKit; when WorkOS was set up outside Convex, register `https://<site>.netlify.app/callback` yourself with `npx workos@latest authkit redirect-uris set`, which replaces the whole list, so pass the local URI too.

## Deploy-on-push

The Netlify GitHub App must be installed for the org, then `npx netlify init` in the repo links the site to the branch. From then on pushes to main build the `production` context and pull requests build `deploy-preview`. A first deploy from the terminal is `npx netlify deploy --prod --build`; without `--build` the CLI uploads the publish directory as it is and skips the Convex push.

## Related Notes

- [[TanStack Start Deployment]] describes the older `app.config.ts` preset switch; this template uses the Vite plugin instead, so the Netlify adapter is the package above, not a preset.
- [[Convex Anti-Patterns]]
- `.claude/skills/setup-project/references/service-netlify.md` is the agent-facing checklist that `/setup-project` follows.
