---
description: Route a prompt as a BUG FIX with the repro / expected / actual / scope gate
argument-hint: <bug description — repro, expected vs actual, where, scope>
---

The user is reporting a **bug**. Treat `$ARGUMENTS` as the description. Read
`.claude/project-config.json` first; `autonomy`, `docs` and `tdd` change the flow below.

## Context load (in this order)

1. `vault/project/features/<feature>.md` — documented vs reported behavior (skip when `docs` is `off`)
2. `vault/tech/<area>/*Anti-Patterns.md`, indexed at `vault/tech/Backend Anti-Patterns Index.md` and
   `vault/tech/Frontend Anti-Patterns Index.md`
3. `vault/_conventions.md` — cite rule IDs only

## Gate — before diving in

The prompt must cover **at least 3 of 4**: **REPRO** (steps), **EXPECTED vs ACTUAL**, **WHERE**
(feature / file / area), **SCOPE** (hotfix or symptom of something deeper). Fewer than 3:
`AskUserQuestion`. Do not grep blindly.

## Bounded discovery

1. Open the file WHERE points at. Read it; do not survey.
2. Anti-pattern indexes next; they often name the bug class faster than more code.
3. Explore only with one concrete target and `breadth: "quick"`.
4. Keep the list of files you opened for the plan's `Discovery references`.

## Decision

**If `autonomy` is `agent`:** say "autonomy=agent, handing off" and run `/handoff-to-agent`. No menu.

**Otherwise present this menu and wait:**

> Ready. How would you like to proceed?
> **T — Test the bug first** *(recommended)*: a failing test that reproduces it → review → fix or hand off
> **I — Fix now**: diagnose and fix in this context
> **H — Hand off**: `/handoff-to-agent` writes the plan and dispatches `/dev`
> **P — Park it**: save the plan for later

When `tdd` is `disabled`, drop T.

- **T** → `/generate-tests <affected-file>` targeting the failing scenario. Confirm RED. Then ask
  "Fix here [I] or hand off [H]?"
- **I** → fix here, following the rules in the hook directive. Do not weaken the assertion to pass.
- **H** → `/handoff-to-agent <name>`. Purpose is REPRO + EXPECTED vs ACTUAL; acceptance is "the
  failing scenario passes".
- **P** → ask where: `vault/local/<name>.md`, `vault/project/in-progress/<name>/plan.md`, or
  `vault/project/backlog/<name>/plan.md`. Write Repro / Expected vs Actual / Where / Scope. Stop there.

## On completion (skip when `docs` is `off`)

If the fix shows `vault/project/features/<name>.md` documented the wrong behavior, correct the doc in
the same turn.
