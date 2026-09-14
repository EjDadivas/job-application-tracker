---
description: Write an intent-only plan and task list under vault/project/in-progress/<name>/ and dispatch /dev. Invoked by /feature or /bug after the gate passes and the user picks H (or autonomy is agent).
argument-hint: Task name (kebab-case, e.g. "add-billing"). Omit to be prompted.
---

Hand-off mode. The gate already passed in `/feature` or `/bug`; the conversation holds the answers
(WHAT / WHERE / WHO / ACCEPTANCE, or REPRO / EXPECTED vs ACTUAL / WHERE / SCOPE).

## Task folder

One folder per task: `vault/project/in-progress/<name>/` holding `plan.md`, `tasks.md`, and, when the
task came from a tracker, `issue.md`.

Resolve `<name>` in this order:
1. If the branch carries an issue ID (`[A-Za-z]+-\d+` after the first `/`) and a folder
   `vault/project/in-progress/<ID>-*/` already exists (written by `/linear`), use that folder. Its name is
   `<name>`; do not ask.
2. Else `$ARGUMENTS`.
3. Else ask: "Name for this task? (kebab-case, e.g. `add-billing`)".

## TDD flag

- Reached H via T (a `/generate-tests` run in this session for this work): `TDD: yes — tests at <path>`.
- No tests yet and `tdd` is `auto` in `.claude/project-config.json`: run `/generate-tests <target>`
  now for the backend surface the plan names, answer its red-phase gate with skip (`/dev` runs the
  red check through qa-tester), then `TDD: yes — tests at <path>`. A surface with no test
  environment in this repo (a route or component, until `src/**/*.test.tsx` runs here) gets
  `TDD: no` with the reason under Open questions.
- Bare H with `tdd` `ask` or `disabled`: `TDD: no`. Picking H over T is the opt-out.

## Size

`size: large` when the work spans backend and frontend, changes data shape, or changes who can do
what (the same test `/feature` uses to recommend grilling); otherwise `size: small`. `/dev` picks
the dev-agent's model from it.

## Write plan.md

Copy `.claude/templates/handoff-plan.md` below its marker line; fill the angle-bracket slots. Intent
only: no filenames in Purpose / Surface / Acceptance, no code, no schema. The one exception is
`Discovery references`, which lists the files inspected during bounded discovery so the dev-agent
does not re-discover them. For a bug, Purpose is REPRO + EXPECTED vs ACTUAL and the acceptance
criterion is "the failing scenario passes".

## Write tasks.md

Copy `.claude/templates/handoff-tasks.md` below its marker line: one numbered task per acceptance
criterion, no file paths, no code, no TDD section (the flag in plan.md governs that).

Both files: exact frontmatter fences, no code fences anywhere in the file.

## Dispatch

Run `/dev <name>`.
