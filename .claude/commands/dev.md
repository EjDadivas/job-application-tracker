---
description: Run a planned task from vault/project/in-progress/<name>/ through the agent chain: red QA, dev-agent, green QA with a fix loop, review, then report
argument-hint: Task folder name under vault/project/in-progress/ (e.g. "add-workspace-sharing" or "TT-42-add-billing")
---

You are the orchestrator. Every agent below is dispatched from this thread, because a sub-agent
cannot spawn sub-agents or run slash commands. The dev-agent writes the code; qa-tester decides
whether tests pass; reviewer agents grade the diff. Each has a fresh context and its own model:
qa-tester haiku, dev-agent sonnet (opus when the plan says `size: large`), reviewer inherits yours.

## No task name

List `vault/project/in-progress/` (one folder per task) and ask which one.

## Task name given (`$ARGUMENTS`)

`NAME=$ARGUMENTS`, `FOLDER=vault/project/in-progress/$NAME`.

### 1. Load

Read `$FOLDER/plan.md` and `tasks.md`. If either is missing, stop and say so:
`/handoff-to-agent $NAME` writes them. Note the `TDD:` and `size:` frontmatter lines.
Read `.claude/project-config.json` for `worktrees`, `autonomy` and `docs`.

### 2. Commit the plan when `worktrees` is `on`

A worktree branches from `HEAD` and sees only what git carries. Commit the task folder, and the
test file when `TDD: yes`, by pathspec:

```bash
git add $FOLDER <test path>
git commit -m "chore($NAME): plan and tasks" -- $FOLDER <test path>
```

Then `BASE=$(git rev-parse HEAD)`. When `worktrees` is `off`, `BASE=$(git rev-parse HEAD)` without
committing.

### 3. Red QA (`TDD: yes` only)

Dispatch `qa-tester` with `Test file: <path from TDD:>`. Expect `FAIL`. A `PASS` means the test does
not exercise the change: stop, say so, and point at `/tdd-reset` then `/generate-tests`.
With `TDD: no`, skip and record `Red QA: skipped (TDD: no)`.

### 4. Dev-agent

Dispatch with the Agent tool, `subagent_type: "dev-agent"`, `isolation: "worktree"` when `worktrees`
is `on`, and `model: "opus"` when the plan says `size: large`. Keep the agent's name; fix rounds go
to the same agent. The prompt is:

```
Task folder: $FOLDER
Commit: <yes when worktrees is on, else no>
Vault map: vault/_index.md (read at most 4 notes). Rules: vault/_conventions.md (cite IDs).

<plan.md verbatim>

<tasks.md verbatim>
```

It returns `DEV COMPLETE` with the worktree path, the test path and a commit SHA. `DIR` is that
path (the current directory when `worktrees` is `off`).

### 5. Green QA, with a fix loop

Dispatch `qa-tester` with `Working directory: $DIR` and `Test file: <path from the report>`. When the
report names no test file, use `Test file: all`. The dev-agent's own run is evidence, not the verdict.

On `FAIL`: send the `QA RESULT` block verbatim to the same dev-agent with SendMessage, prefixed
`Fix round <n> of 3. Make this pass without editing the test.` Wait for `DEV FIX <n>`, then run
QA again. Three rounds at most. After the third `FAIL`, stop the chain: report `CHAIN FAILED at QA`
with the last QA block and the worktree path, and leave the code for the person. Do not fix it here.

### 6. Review

Dispatch two `reviewer` agents in one message so they run in parallel. Both get:

```
Directory: $DIR
Diff command: git diff $BASE
Commits command: git log $BASE..HEAD --oneline
```

The first adds `Axis: Standards` and `Rule IDs in scope: <from plan.md>`. The second adds
`Axis: Spec` and `Spec: vault/project/done/$NAME/plan.md` (the dev-agent moved the folder).

Blocking findings on either axis go back to the dev-agent once, all in one SendMessage prefixed
`Review fix round. Address every blocking finding; advisory ones only if trivial.` Then run step 5
once more (a single QA run, no loop). When `autonomy` is `guided`, show the findings and ask
before sending them. Advisory-only results need no fix round.

Do not merge or re-rank the two axes; a change can pass one and fail the other.

### 7. Docs

If `docs` is `full`, run `/feature-sync <feature>` for the feature the plan names.

### 8. Report

```
DEV CHAIN — $NAME
Branch / worktree: <branch> at $DIR
Red QA:   FAIL as expected | skipped (TDD: no)
Dev:      DEV COMPLETE, <n> QA fix rounds
Green QA: PASS (round <n>)
Review:   Standards <n> (<m> blocking) · Spec <n> (<m> blocking) · fix round: yes | no
Advisory: <one line each, or none>
Docs:     synced | skipped (docs: off)
Next:     merge <branch> | <what the person has to decide>
```

Merging is the person's call; never merge or push from here. When `worktrees` is `off`, the code is
uncommitted in this checkout and `Next` says so.
