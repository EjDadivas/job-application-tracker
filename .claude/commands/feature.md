---
description: Route a prompt as a NEW FEATURE request with the clarifying-question gate
argument-hint: <feature description — what, where, who, acceptance>
---

The user is requesting a **new feature**. Treat `$ARGUMENTS` as the description. Read
`.claude/project-config.json` first; `autonomy`, `docs` and `tdd` change the flow below.

## Context load (in this order)

1. `vault/_conventions.md` — cite rule IDs (B-xx / F-xx / X-xx); do not re-read in full
2. `vault/project/ROADMAP.md` and `vault/project/SPEC.md` if they exist: the current phase and the
   spec sections that cover this feature. They are the product description; never say there is
   none while these files exist. When the spec settles a gate part, take it from there and confirm
   it in one line instead of asking.
3. `vault/project/features/<area>.md` if it exists (skip when `docs` is `off`)
4. `vault/_index.md` "By task" row → ≤2 topic notes

## Gate — before any file reads or edits

The prompt must cover **at least 3 of 4**: **WHAT** (user-visible behavior), **WHERE** (backend,
route, both), **WHO** (role / permission), **ACCEPTANCE** (one concrete success scenario). Fewer
than 3: `AskUserQuestion`, do not guess. Ask only the parts that are missing; design, styling and
copy questions are not gate parts and go to the person as a one-line assumption, not a form field.

**Recommend grilling** (menu option G) when the work spans backend and frontend, changes data
shape, changes who can do what, would be hard to undo, or the gate answers came back vague. Say so
in one line; do not start grilling unasked.

## Bounded discovery — after the gate, before the menu

Enough to fill the handoff plan, no more. Hard limits: at most one `Explore` call, never two in
parallel, never an open-ended brief.

1. Vault first: `vault/architecture/backend/feature-folder-layout.md` (B-17) for folder shape.
2. `ls convex/features/` — if empty, note "greenfield, no siblings" and stop discovering.
3. One sibling read at most (`mutations.public.ts` or `queries.public.ts`).
4. If Explore is needed, name one file and ask for specific lines, `breadth: "quick"`.
5. Keep the list of files you opened for the plan's `Discovery references`.

## Decision

**If `autonomy` is `agent`:** say "autonomy=agent, handing off" and run `/handoff-to-agent`. No menu.

**Otherwise present this menu and stop.** Do not draft a plan, enter Plan mode, or pick for the
user. If the harness auto-enters Plan mode, exit it and show the menu.

> Ready. How would you like to proceed?
> **G — Grill it first**: walk the design tree before any code *(recommended for large or hard-to-undo work)*
> **T — Tests first** *(recommended)*: generate failing tests → review → implement or hand off
> **I — Implement now**: code in this context
> **H — Hand off**: `/handoff-to-agent` writes the plan and dispatches `/dev`
> **P — Park it**: save the plan for later

List G first only when the size test says so; otherwise last, with T recommended. When `tdd` is
`disabled`, drop T.

- **G** → invoke the `grilling` skill seeded with the gate answers; when it ends, offer T / I / H / P
  (or `/spec` if the scope grew into a document).
- **T** → `/generate-tests <target-path>`, then ask "Implement here [I] or hand off [H]?"
- **I** → implement here, following the rules in the hook directive.
- **H** → `/handoff-to-agent <name>`. It infers `TDD:` (T-then-H → yes; bare H → no).
- **P** → ask where: `vault/local/<name>.md` (gitignored, tentative), `vault/project/in-progress/<name>/plan.md`
  (committed, ASAP), or `vault/project/backlog/<name>/plan.md` (committed, later). Write What / Where
  (as area) / Who / Acceptance only; no rule IDs, no TDD flag. Stop there.

## On completion (skip when `docs` is `off`)

If the feature landed and `vault/project/features/<name>.md` does not exist, create it from
`vault/project/features/_template.md` and register it in `vault/project/features/_index.md`. If it
exists, update Purpose / User flow / Public API / Open questions in place. `/feature-sync <name>`
does the same reconciliation later.
