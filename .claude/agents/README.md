# Agents

An agent is a **fresh context** with a narrow job. That is the whole reason to use one: it does not
inherit the conversation, so it cannot be biased by it, and its verbose output never lands in yours.

If a task does not need one of those two properties, do it in the main thread instead. Reaching for
an agent that neither isolates context nor bounds output just adds a hop.

## The three agents

| Agent | Dispatched by | Model | Job |
|---|---|---|---|
| `dev-agent` | `/dev` (which `/handoff-to-agent` invokes) | sonnet, opus for `size: large` | Implements an intent-only plan in a clean context. Derives filenames from sibling code and the vault, runs its own tests and lint, takes fix rounds by SendMessage. |
| `qa-tester` | `/dev`, `/generate-tests` | haiku | Runs **one** test file (or the suite) in a given directory and returns pass/fail. The verbose run stays inside the sub-agent. |
| `reviewer` | `/dev`, `/review` | inherits the caller's | Grades a diff on one axis, Standards or Spec, and marks each finding blocking or advisory. Read-only tools. |

Sub-agents cannot dispatch sub-agents or run slash commands, so `/dev` in the main thread is the
orchestrator. The chain: qa-tester on the red test (must fail), dev-agent, qa-tester on the green
test (must pass; a failure goes back to the same dev-agent, three rounds), two reviewers in
parallel (blocking findings go back once, then QA again), report. Each exists for a reason you can
state in one line, which is the bar for adding a fourth.

## Vault-first protocol

An agent starts with no conversation history, so it has no idea what was already established. It
reads the vault instead:

1. `vault/_index.md` — the navigation hub, first.
2. At most **4** notes the hub links to for the task at hand.
3. The relevant rule IDs from `vault/_conventions.md`.
4. Cite what you used: `per [[fixture-hierarchy]]`, `per B-11`.

**Point at the vault, never copy it into the agent file.** Copied rules drift from their source and
you end up with two versions that disagree — that is exactly how this repo grew four conflicting
statements of rule B-01.

Keep this preamble intact when editing an agent. It is what keeps them cheap.

## Adding one

```markdown
---
name: my-agent
description: What it does. Use when <branch>, <branch>, or <branch>.
tools: Read, Grep, Bash        # least privilege — omit to inherit everything
model: haiku | sonnet | opus
---
```

The `description` is a **context pointer**: its wording, not the body, decides whether the agent
ever gets selected. Name the distinct branches that should trigger it. See
`.claude/skills/writing-for-agents/SKILL.md`.

Two rules learned the hard way:

- **Wire it to a caller, or don't add it.** Seven of the nine agents here were never dispatched by
  any command, skill, or hook. They were maintenance with no upside.
- **Give it the smallest `tools` list that works.** `qa-tester` has `Bash` and nothing else, so it
  cannot wander off and edit the code it is grading.

## What was removed, and why

Kept here so these don't get rebuilt:

| Removed | Reason |
|---|---|
| `code-architecture-reviewer` | Superseded by `/review`, which runs two axes in parallel instead of one; the `reviewer` agent is that axis runner, not a return of this one. |
| `refactor-planner`, `code-refactor-master` | A plan/execute pair, never dispatched. `/grill` plans better; `/review` catches the same problems. |
| `plan-reviewer` | Overlapped `/grill` before the work and `/review` after it. |
| `frontend-error-fixer` | Debugging needs the conversation that produced the error. Handing it to a fresh context throws away the evidence. A dev-agent resumed with the QA output is the bug fixer in the chain. |
| `web-research-specialist` | 183 lines wrapping `WebSearch`. |
| `test-generator` | `/generate-tests` does the same job inline, and keeps the vault reads in one place. |

## Related

- [Driving Claude Code](https://github.com/TwoTabs/devkit/wiki/Driving-Claude-Code) — how agents, commands and hooks fit together
- `.claude/skills/writing-for-agents/SKILL.md` — writing a description that actually fires
- `.claude/commands/review.md` — the two-axis review; `.claude/commands/dev.md` — the chain
