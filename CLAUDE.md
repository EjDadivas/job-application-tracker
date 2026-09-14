# Project Guide

> Project-level memory for Claude Code. Read this first. Keep it short and current; link out to
> the Obsidian `vault/` for anything detailed rather than duplicating it here.

## Project summary

<!-- devkit:project-summary-placeholder. Replace this whole block once filled. -->

**⚠️ Not filled in yet.** `/setup-project` asks for a short description of the project, what it
does and who it's for, and replaces this block with it. Until then, ask before starting feature work.

## Stack

TanStack Start + Convex + WorkOS AuthKit + shadcn/ui (Radix primitives vendored in
`src/components/ui/`, styled with `cn()` + Tailwind) + PostHog (analytics, error tracking, feature flags).
The template ships **no domain**. `convex/features/health` and `src/routes/health.tsx` are a smoke
test, not a reference feature; delete them once real features exist. Resend docs live in
`vault/tech/resend/` but email isn't wired into this template yet.

## Working here

- Package manager is **npm** (`pm` in `.claude/project-config.json`; `/setup-project` rewrites
  this bullet when it changes). `npm test -- <path>` runs one Vitest file; `npm run lint` is `tsc` +
  ESLint; `npm run gen` rebuilds the route tree (run it after touching `src/routes/`); `npm run dev`
  starts Convex and Vite together; `npm run check:devkit` validates vault links and `.claude/`.
- **House conventions override library defaults.** Rules are numbered in `vault/_conventions.md`
  (B-xx backend, F-xx frontend, X-xx cross-cutting). Cite the ID; never restate the rule text.
- Vault-first: `vault/_index.md` is the map. Read at most 4 notes for a task.
- Plans live in `vault/project/in-progress/<name>/` (`plan.md`, `tasks.md`, optional `issue.md`) and
  move to `vault/project/done/<name>/` when shipped.
- Workflow switches (`tdd`, `autonomy`, `docs`, `worktrees`) live in `.claude/project-config.json`;
  `/config` shows or changes them.
- Prose a person will read (PR descriptions, commit bodies, vault notes, READMEs, tracker updates)
  goes through the `unslop` skill before it is written. The three rules that matter most: say what
  it does, not how it feels; no bold label plus colon that restates the line; no em dashes.

## Conventions & docs

- Conventions / rule set: `vault/_conventions.md`
- Knowledge base & architecture: start at `vault/_index.md`
- Skills, agents, commands, hooks: `.claude/`

> `## Stack notes` and `## Project config` are written by `/setup-project`. Run it first.
