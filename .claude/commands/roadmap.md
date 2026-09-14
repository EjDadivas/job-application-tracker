---
description: Turn SPEC.md into vault/project/ROADMAP.md — ordered phases, each with exit criteria and a validation command
argument-hint: '[phase name] — omit to build or refresh the whole roadmap'
---

Produce `vault/project/ROADMAP.md` (or the roadmap path in `.claude/project-config.md`) from the
spec.

The file you write is read by people. Apply the `unslop` skill's self-audit to the prose before writing it.
**Exit criteria are the point of this command.** Acceptance criteria say when a *ticket* is done.
Exit criteria say **what must be true before the next phase starts**. That is the thing this
workflow has never written down, and the reason phases bleed into each other.

## Step 1 — Read

1. `.claude/project-config.md` — paths and tracker. If it does not exist, default to
   `vault/project/ROADMAP.md`, say so in one line, and carry on.
2. `vault/project/SPEC.md` — **required.** If it does not exist, stop and tell the user to run
   `/spec` first. Do not invent a spec.
3. `vault/project/ROADMAP.md` if it exists — you are updating, not replacing. Preserve completed
   phases and their recorded status verbatim.

## Step 2 — Draft the phases

Break the spec's Required behavior into **ordered phases**.

- Order by **what unblocks what**, not by what is easiest or most exciting.
- A phase is a coherent outcome, not a layer. "Auth works end to end" is a phase; "write all the
  backend" is not.
- Prefer fewer, larger phases over many small ones — small ones belong in the tracker as tickets.
  Three to six phases is typical.
- Anything in the spec's **Non-goals** is not a phase. If it keeps trying to become one, that is a
  signal to reopen the spec with the user, not to quietly include it.

For each phase draft:

| Field | What it holds |
|---|---|
| **Status** | `Not started` · `In progress` · `Complete` |
| **Outcome** | What is true when this phase ends, in one or two sentences |
| **Included work** | The bullets. Behaviour, not file paths |
| **Dependencies and risks** | What must exist first; what could go wrong |
| **Exit criteria** | What must be true before the next phase starts. Checkable, not aspirational |
| **Validation** | The actual command or check that proves the exit criteria — the test and lint commands from `CLAUDE.md` § Working here, `/setup-project verify`, "a second person can clone and run it" |

**Exit criteria and Validation are different things and both are required.** Exit criteria are the
claim; validation is the evidence. A phase with an exit criterion nothing can check is a phase
that will be declared done by vibes.

**Every phase's Validation ends with the lint command**, and any phase that adds or moves a route
lists the gen command immediately before it. Take both from `CLAUDE.md` § Working here and write
the real command (`pnpm run lint`, not `<pm> run lint`). `src/routeTree.gen.ts` is rebuilt only by the Vite
plugin, so a new route is absent from the router's type union until `gen` runs — and `lint` then
fails with errors that look like application bugs and are not. A phase whose Validation omits
these two will be declared complete on green tests alone, which is how a red typecheck ships.

## Step 3 — Quiz the user

Present the draft as a numbered list — phase title, outcome, exit criteria. Then ask:

- Is the **order** right? Does each phase only depend on phases above it?
- Are the **exit criteria** actually checkable, or are any of them wishes?
- Should any phase be **split or merged**?

Iterate until the user approves. Do not write the file before they do.

## Step 4 — Write

**Copy `.claude/templates/roadmap.md`. Do not compose the file's shape from this description.**

Open that file, take everything below the marker line, starting with its `---` frontmatter fence, fill the angle-bracket slots, and repeat
the `## Phase <n>` block once per phase. If the file is missing, say so and stop — do not
reconstruct it from memory.

Three things that go wrong when this section is written rather than copied:

- **The frontmatter must be exact**: `---`, `tags: [project, roadmap]`, `_verified: <today>`,
  `---`. Both fences, no blank line inside, nothing between the opening `---` and `tags:`. A
  missing closing fence turns the whole block into body text and Obsidian indexes nothing.
- **No code fences anywhere in the output.** Not around the frontmatter, not around a phase, and
  not around the continuation of a long bullet. An exit criterion that wraps continues as a plain
  line indented two spaces. Every backtick fence you emit is a bug.
- **Preserve completed phases verbatim.** You are updating a file, not regenerating one. A phase
  marked `Complete` keeps its status, its wording and its recorded validation.

## Step 5 — Report and hand off

Show where it landed and name the **current phase** and its exit criteria explicitly.

Then **recommend the next step — do not take it.** Do not run it yourself. This holds even when
`autonomy` is `agent`: the setup chain ends here, and work starts when the user says so. The next
step depends on the tracker named in `.claude/project-config.md`:

> ✅ Roadmap written to `vault/project/ROADMAP.md`. Current phase: **<name>**. Next:
> **`/linear`** — breaks *this phase only* into tickets.
>
> Run it when you're happy with the phases.

With local markdown as the tracker there are no tickets to cut; the phase's items are the list:

> ✅ Roadmap written to `vault/project/ROADMAP.md`. Current phase: **<name>**. Next: `/clear`, then
> **`/feature <first item of the phase>`**.

Only the current phase. Turning the whole roadmap into tickets up front produces a backlog that is
stale before it is worked.

Then stop and end the turn. **Do not write code or tickets from this command.**

## Keeping it current

A phase moves to `Complete` only when its **validation actually ran and passed** — not when the
work feels done. If you are asked to mark a phase complete and the validation has not run, say so
and run it, or say plainly that it is unverified.

## Related

- `/spec` — the input to this command
- `/linear` — turns the current phase into tickets
- [Claude Setup](https://github.com/TwoTabs/devkit/wiki/Claude-Setup) — where this sits in the flow
