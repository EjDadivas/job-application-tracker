---
description: Grill the user, then write vault/project/SPEC.md — problem, users, required behavior, non-goals, acceptance criteria
argument-hint: '[what the spec is for] — omit to spec whatever this conversation has been about'
---

Produce `vault/project/SPEC.md` (or the spec path named in `.claude/project-config.md`).

The file you write is read by people. Apply the `unslop` skill's self-audit to the prose before writing it.
A spec is **what must be true**, not how to build it. No file paths, no code snippets — both go
stale within a sprint. Name modules, interfaces and behaviours instead.

## Step 1 — Read the config and the current state

1. `.claude/project-config.md` — where the spec goes, which tracker. If it does not exist,
   default to `vault/project/SPEC.md`, say so in one line, and carry on.
2. `vault/project/SPEC.md` — **if it already exists, you are revising, not starting over.** Read
   it, and only grill on what is actually changing. Never silently discard existing sections.
3. `vault/_conventions.md` — so the spec cites rule IDs instead of restating them
4. Enough of the repo to ask informed questions — `README.md`, `vault/_index.md`, the feature
   docs under `vault/project/features/`

## Step 2 — Grill

Invoke the `grilling` skill (call the Skill tool with `grilling`) and run it against `$ARGUMENTS`,
or against this conversation if `$ARGUMENTS` is empty.

Run it to exhaustion — **the frontier must be empty before you write.** Let the tree grow from the
work; do not seed it with the spec's section headings. A spec organised around its own template is
the shape you get when the interview was really a form.

**Skip the grilling entirely** only when the user explicitly says the decisions are already made
and asks you to just write it up. Then synthesise from this conversation without interviewing.

Before you write, you must be able to answer **"what goes wrong for a person if this is never
built?"** in the user's own words. If you cannot, the frontier is not empty — ask. Read Step 1's
repo files for context, never for the problem statement; the grilling skill's Motivation note says
why.

You must also be able to name, for every behaviour that fires on its own, **what invokes it and
how often.** Lazy provisioning, backfills, cache warming and first-run setup all get written down
as a moment — "on first load", "when they arrive" — while the frontier still has a hole in it.
Keep asking until each one has a caller and a frequency.

## Step 3 — Confirm the seams

Before writing, propose **where this gets tested from** — the public boundaries you would observe
behaviour at, without reaching inside.

Prefer existing seams to new ones. Use the highest seam available. **Fewer seams is better; one
is ideal.** Check the proposal with the user — this lands in Testing decisions and governs every
test written later.

## Step 4 — Write the spec

**Copy `.claude/templates/spec.md`. Do not compose the file's shape from memory.**

Open that file, take everything below the marker line, starting with its `---` frontmatter fence, and fill the angle-bracket slots. If it
is missing, say so and stop — do not reconstruct it.

Two things that go wrong when this is written rather than copied:

- **The frontmatter must be exact**: `---`, `tags: [project, spec]`, `_verified: <today>`,
  `status: draft`, `---`. Both fences, nothing between the opening `---` and `tags:`. A missing
  closing fence turns the block into body text and Obsidian indexes nothing.
- **No code fences anywhere in the output.** Not around the frontmatter, not around a section, and
  not around the continuation of a long bullet — a bullet that wraps continues as a plain line
  indented two spaces. Every backtick fence you emit is a bug.

## Step 5 — Report and hand off

Show the user where it landed and summarise Non-goals and Unresolved questions specifically —
those are the two that change what gets built, and the two people skim past.

Then **recommend the next step — do not take it.** Do not run `/roadmap` yourself, and do not
start drafting phases:

> ✅ Spec written to `vault/project/SPEC.md`. Next: **`/roadmap`** — turns this into ordered
> phases, each with exit criteria and a command that proves them.
>
> Run it when you're happy with the spec.

Then stop and end the turn. **Do not write code, tests, or tickets from this command.**

## Related

- `.claude/skills/grilling/SKILL.md` — the interview
- `/roadmap` — the next step
- `/linear` — tickets, after the roadmap
