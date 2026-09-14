---
description: Two-axis review of a diff — Standards (repo rules + code smells) and Spec (does it do what was asked) — in parallel fresh-context sub-agents
argument-hint: '<fixed point — main, a SHA, HEAD~3, a branch> [-- path/to/spec]'
---

Review the diff between `HEAD` and a fixed point, along **two independent axes**:

- **Standards** — does the code follow this repo's documented rules?
- **Spec** — does the code do what the ticket or spec actually asked for?

Both run as **parallel sub-agents in fresh contexts**, then this command reports them side by side.

## Why two axes, and why they must not be merged

A change can pass one and fail the other:

- Follows every rule, builds the wrong thing → **Standards pass, Spec fail.**
- Does exactly what the ticket asked, ignores every convention → **Spec pass, Standards fail.**

Report them separately. **Do not merge or re-rank the findings** — one axis masking the other is
the exact failure this separation exists to prevent.

## Why fresh context

**The session that wrote the code must not grade it.** A context that just argued itself into a
design will rationalise it again. Sub-agents start clean and see only the diff, the rules and the
spec — never the conversation that produced the code.

---

## Step 1 — Pin the fixed point

`$ARGUMENTS` holds the fixed point (`main`, a SHA, `HEAD~3`, a branch). If it's missing, ask —
do not guess.

Verify before spawning anything:

```bash
git rev-parse <fixed-point>
git diff <fixed-point>...HEAD --stat
git log <fixed-point>..HEAD --oneline
```

Use **three-dot** `...` so the comparison runs against the merge-base, not the branch tip.

**A bad ref or an empty diff must fail here**, not inside two sub-agents that each burn a context
discovering it.

## Step 2 — Find the spec

In this order, stopping at the first hit:

1. A path passed after `--` in `$ARGUMENTS`
2. A Linear or GitHub issue ID in the branch name or commit messages — fetch it the way
   `.claude/project-config.md` describes
3. `vault/project/in-progress/<name>/plan.md` or `vault/project/done/<name>/plan.md`, where `<name>`
   contains the branch's issue ID or slug
4. `vault/project/SPEC.md`
5. `vault/project/features/<area>.md` for the area the diff touches

If nothing is found, ask. If the user says there is no spec, **skip the Spec sub-agent** and say so
in the report — do not invent a spec to review against.

## Step 3 — Spawn both reviewers, in parallel, in one message

Two `reviewer` agents (`.claude/agents/reviewer.md`), one per axis, sent as two Agent calls in a
**single message** so they actually run concurrently. The agent holds the standards sources and
the smell baseline; you pass only what it cannot know:

```
Axis: Standards
Directory: <absolute path of this checkout>
Diff command: git diff <fixed-point>...HEAD
Commits command: git log <fixed-point>..HEAD --oneline
Rule IDs in scope: <from the plan, if there is one>
```

```
Axis: Spec
Directory: <absolute path of this checkout>
Diff command: git diff <fixed-point>...HEAD
Commits command: git log <fixed-point>..HEAD --oneline
Spec: <path from Step 2>
```

Each returns a `REVIEW <Axis>` block with findings marked blocking or advisory. Skip the Spec agent
when Step 2 found no spec.

## Step 4 — Wait for both

Do nothing else until both blocks are back. Do not read the diff yourself in the meantime; the
point of the fresh contexts is that this session's view of the code plays no part.

## Step 5 — Aggregate, do not re-rank

Present both reports under `## Standards` and `## Spec`, verbatim or lightly cleaned.

End with one line per axis: the count, the blocking count, and the worst finding **within that
axis**. Do not pick a single overall winner across the axes — that is the re-ranking the separation
exists to prevent.

```
Standards: N findings (M blocking) — worst: <one line>
Spec:      N findings (M blocking) — worst: <one line>
```

If the Spec axis was skipped, say **"Spec: skipped — no spec found"**. Never let a skipped axis
read as a pass.

## Step 6 — Offer, do not act

**Return findings only. Do not fix anything.** A reviewer that edits stops being a reviewer.

> Fix any of these? Say which numbers, or **all standards** / **all spec**.

## Related

- `.claude/agents/reviewer.md` — the agent both axes run in; the smell baseline lives there
- `vault/_conventions.md` — the rule IDs cited on the Standards axis
- `/dev` — runs the same two reviewers after QA passes and sends blocking findings back to the dev-agent
- `/spec` — writes the SPEC the Spec axis reviews against
