---
name: ask-devkit
description: Ask which command, skill or switch fits your situation. A router over the devkit in this repo.
disable-model-invocation: true
---

# Ask Devkit

You don't remember every command, so ask. Answer from this file; open a command or skill file only
when the question is about a detail this file does not carry.

A **flow** is a path through the commands. Most work runs along one **main flow**, and three
**on-ramps** merge onto it. Everything else is standalone, or a vocabulary layer that runs
underneath. The agents behind `/dev` are listed in `.claude/agents/README.md`.

## Precondition

**`/setup-project`**: once per repo, before anything else. It asks for the package manager, the
tracker, the four workflow switches and a project summary, installs, wires Convex, WorkOS,
PostHog and Netlify through their CLIs, and verifies. It ends by telling you to `/clear` and run
`/spec`; the setup context is install output and nothing the spec needs. `/setup-project verify`
re-runs the checks alone.

## The main flow: idea → ship

1. **`/spec`** sharpens the idea by interview (the `grilling` skill, rounds of numbered questions
   with a recommended answer each) and writes `vault/project/SPEC.md`: problem, users, required
   behaviour, non-goals, acceptance criteria. Terms the interview settles land in
   `vault/_glossary.md` and hard-to-reverse decisions in `vault/project/decisions/` as they happen.
2. **`/roadmap`** turns the spec into `vault/project/ROADMAP.md`: ordered phases, each with exit
   criteria and a validation command. Run it in the same window as `/spec`.
3. **Branch: which tracker?** `/roadmap` names the next step from `.claude/project-config.md`.
   - **Linear** → **`/linear`** cuts the current phase into tickets, one branch per ticket
     (`user/ID-title`), and saves each issue to `vault/project/in-progress/<ID>-<slug>/issue.md`.
   - **Local markdown** → skip tickets; the roadmap phase is the list, and each item goes straight
     to `/feature`.
4. **`/feature <what>`** per item. It reads the spec and roadmap, then gates on WHAT / WHERE / WHO /
   ACCEPTANCE (three of four; settled parts are taken from the spec and confirmed in one line), does
   bounded discovery, and then:
   - `autonomy: guided` shows the menu: **G** grill first, **T** tests first, **I** implement here,
     **H** hand off, **P** park it.
   - `autonomy: agent` goes straight to **H**.
5. **`/handoff-to-agent <name>`** (the H path) writes an intent-only `plan.md` and `tasks.md` under
   `vault/project/in-progress/<name>/`, writes the red test first when `tdd` is `auto`, and runs
   `/dev`.
6. **`/dev <name>`** is the chain, orchestrated from your window because sub-agents cannot spawn
   sub-agents: qa-tester confirms the test is red, dev-agent implements (in its own worktree when
   `worktrees` is `on`), qa-tester confirms green and sends failures back to the same dev-agent for
   up to three rounds, two reviewer agents grade the diff on Standards and Spec, blocking findings
   go back once, then it reports. Merging the branch is yours.
7. **`/review <base>`** on its own reviews any branch or PR against a fixed point, same two axes.

### Context hygiene

Setup in its own window. `/spec` and `/roadmap` in one window. Then one window per `/feature`:
the chain's agents start fresh from the plan, so nothing in your window is needed once `/dev` has
reported. `/clear` at each of those boundaries; see Phase boundaries for when to compact instead.

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Something's broken** → **`/bug <what>`**. Gate: REPRO / EXPECTED vs ACTUAL / WHERE / SCOPE
  (three of four). With `tdd: auto` it reproduces with a failing test first. Then the same menu as
  `/feature`, and the same hand-off and chain.
- **A ticket exists** → **`/linear`** on the ticket's branch fetches it and saves the issue file;
  `/feature` or `/bug` then reads it. Tentative work goes to `vault/local/linear/` (gitignored).
- **A meeting happened** → **`/meeting <transcript>`** (only with `docs: full`) writes structured
  notes to `vault/project/meetings/`; decisions from it feed `/spec` or `/feature`.

## Standalone

- **`/grill <topic>`**: the interview on its own, no spec written. Ends by offering `/spec`,
  `/feature` or `/linear`.
- **`/ask <question>`**: a quick answer in minimal-context mode, no deep reads.
- **`/architecture <question>`**: how we do things here, answered from `vault/architecture/`,
  `vault/_conventions.md` and the anti-pattern indexes, citing rule IDs. No code changes.
- **`/generate-tests <target>`** writes tests before the code and locks them; **`/tdd-reset`**
  unlocks. Both are what the T menu option runs.
- **`/config [key] [value]`** shows or changes a switch; `/setup-project` wrote them.
- **`/vault tech|project: <topic>`** and **`/feature-sync <feature>`** keep the vault current; both
  stop when `docs` is `off`.

## Vocabulary underneath

Model-invoked skills the commands pull in, or that fire on their own from the prompt:

- **`domain-language`**: the glossary and ADRs. Challenge a fuzzy term, record a decision.
- **`architecture`**: the house standards (feature folders, API aggregator, modular schema,
  3-layer), owner of the rule IDs the other skills cite.
- **`convex`, `tanstack`, `workos`, `resend`, `error-tracking`, `tdd-workflow`**: stack patterns,
  one per area. House conventions in `vault/_conventions.md` override their defaults.
- **`git-commit`** for commit messages, **`unslop`** for any prose a person reads,
  **`writing-for-agents`** for any document an agent reads.

## What the hook line means

Every prompt gets a `[devkit]` line from the `skill-activation-prompt` hook: the skills whose
triggers matched, the intent it classified (FEATURE, BUG or QUESTION) with that intent's gate, and
the TDD mode. The pre-implementation rules block prints once per session. `/feature`, `/bug` and
`/ask` prompts get no line, since the command carries it. A line saying
`.claude/project-config.json is missing` means setup has not run. The `test-guard` hook denies
edits to locked test files until `/tdd-reset`.

## The switches

`/config` shows them; `.claude/project-config.json` holds them.

- **`pm`**: which install and test commands everything uses.
- **`tdd`**: `auto` writes the failing test before code, `ask` offers it, `disabled` skips it.
- **`autonomy`**: `guided` shows menus, `agent` hands off without asking.
- **`docs`**: `off` skips feature docs, `/vault`, `/meeting` and `/feature-sync`. Spec and roadmap
  are always written.
- **`worktrees`**: `on` gives each dev-agent its own worktree and branch.

## Where things live

`vault/_index.md` is the map. `_conventions.md` holds the rules (cite the ID, never restate).
`_glossary.md` and `project/decisions/` are the vocabulary. `project/SPEC.md` and `ROADMAP.md`
are the product. `project/in-progress/<name>/` is a task in flight and `project/done/<name>/`
one that shipped. `project/docs/` holds diagrams, flows and reports. `project/features/` and
`project/meetings/` exist only with `docs: full`.
`vault/local/` is gitignored scratch. `.claude/state/` is hook state, also gitignored.

## Phase boundaries

A **phase** is a chunk of work inside a session: the grilling, the implementation, the QA. At the
**boundary** between two of them you have options, and picking between them is the fuzziest
decision in this whole map: **Continue**, **`/clear`**, **Subagent**, or **`/compact`**. Read
[PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) for the ordered tree. It also lists `/handoff`, Matt
Pocock's portable-file skill; this kit has no equivalent, so when the work has to travel, write the
file by hand and put it in `vault/local/`.
