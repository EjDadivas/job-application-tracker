---
description: Stress-test a plan, design or decision with a relentless design-tree interview before any code is written
argument-hint: <what to grill — a plan, a feature idea, a decision, or nothing to grill the current conversation>
---

Invoke the `grilling` skill (call the Skill tool with `grilling`) and run it against `$ARGUMENTS`.

If `$ARGUMENTS` is empty, grill whatever plan or idea is already in this conversation. If there
isn't one, ask what they want grilled — one line, then stop.

**Before the first round**, load just enough context to ask informed questions:

1. `vault/_conventions.md` — so you can cite rule IDs rather than re-deriving conventions
2. `vault/project/features/<area>.md` if the topic maps to an existing feature
3. `vault/project/SPEC.md` if it exists — a grilling session should not re-open settled scope

Then run the loop: compute the frontier, ask the whole frontier in one numbered round with a
recommended answer per question, wait, recompute.

**Do not write code, tests, or a plan file during grilling.** When the frontier is empty, confirm
shared understanding with the user and offer the next step:

> Frontier's empty. Next: **S** — write it up (`/spec`) · **F** — back to the feature menu
> (`/feature`) · **L** — break into tickets (`/linear`) · **N** — nothing, I just wanted to think

## Related

- `.claude/skills/grilling/SKILL.md` — the interview loop itself
- `/spec` — writes the outcome to `vault/project/SPEC.md`
