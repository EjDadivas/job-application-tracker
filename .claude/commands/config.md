---
description: View or change a switch in .claude/project-config.json (pm, tdd, autonomy, docs, worktrees)
argument-hint: '[pm|tdd|autonomy|docs|worktrees] [value]'
---

The switches live in `.claude/project-config.json` at the project root. The `skill-activation-prompt`
hook reads that file on every prompt; the commands read it when they branch on a switch.

| Key | Values | What it changes |
|---|---|---|
| `pm` | `npm` · `pnpm` · `bun` · `yarn` | Which install and test commands the commands and agents use, via the first bullet of `## Working here` in `CLAUDE.md`. Setting it here does **not** replace the lockfile or the CI step; `/setup-project` does that. |
| `tdd` | `auto` · `ask` · `disabled` | `auto`: FEATURE/BUG turns start with `/generate-tests`. `ask`: offered after the gate. `disabled`: no test step. |
| `autonomy` | `guided` · `agent` | `guided`: `/feature` and `/bug` show the G/T/I/H/P menu. `agent`: they go straight to `/handoff-to-agent`. |
| `docs` | `full` · `off` | `off`: feature docs, `/feature-sync`, `/vault` and `/meeting` steps are skipped. `/spec` and `/roadmap` still write. |
| `worktrees` | `off` · `on` | `on`: `/dev` dispatches dev-agent with `isolation: "worktree"`. |

## No argument — show

Read the file and print one line per key, `key: value`. If the file is missing, say so and point at
`/setup-project`, which writes it.

## `<key> <value>` — set

1. Read the file. If missing, create it with the defaults `pm` from the lockfile, `tdd=ask`, `autonomy=guided`,
   `docs=full`, `worktrees=off` first and say you did.
2. Reject an unknown key or a value outside the table above; print the table and change nothing.
3. Write the updated JSON with 2-space indent. Print `key: old → new`.
4. Mirror the change in the `## Workflow` section of `.claude/project-config.md` if that file exists.
   For `pm`, also rewrite the `Package manager is` bullet in `CLAUDE.md` with that manager's
   commands (the table is in the `setup-project` skill, Part A Step 0).

The change takes effect on the next prompt. An active TDD lock (`.claude/state/tdd-lock.json`) is
not affected; `/tdd-reset` clears that.
