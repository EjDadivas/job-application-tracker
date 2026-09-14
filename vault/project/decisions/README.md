---
tags: [decision, adr, index]
_verified: 2026-09-04
---

# Decisions (ADRs)

One file per architectural decision: `NNNN-<slug>.md`, numbered from `0001`.

Written by the `domain-language` skill. Kept **sparse on purpose** — a folder full of ADRs
recording obvious choices is worse than an empty one, because nobody reads either.

## When a decision earns an ADR

All three must be true:

1. **Hard to reverse** — changing your mind later costs something real.
2. **Surprising without context** — a future reader will ask "why did they do it this way?"
3. **A genuine trade-off** — there were real alternatives, and one was chosen for stated reasons.

Miss one and there is no ADR.

### What qualifies

- **Architectural shape.** A monorepo; an event-sourced write model with a projected read model.
- **Integration patterns between parts.** Two features talk through Convex scheduled functions,
  not through shared tables.
- **Technology choices that carry lock-in.** Database, auth provider, deployment target. Not every
  library, only the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** Which feature owns a table; what other features may read by
  ID only. The explicit no is as valuable as the yes.
- **Deliberate deviations from the obvious path.** Anything a reasonable reader would assume the
  opposite of. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** A compliance rule that forbids a region; a latency
  budget from a partner contract.
- **Rejected alternatives when the rejection is not obvious.** Considered and dropped for subtle
  reasons; without a record, someone proposes it again in six months.

An ADR can be a single paragraph: what forced the choice, what was chosen, and why. Sections are
added only when they carry something the paragraph cannot.

## Rules

- **Never renumber, never delete.** Supersede instead: write a new ADR and set the old one's
  `status: superseded by [[NNNN-...]]`. The record of a decision that was later reversed is often
  more useful than the decision itself.
- **One paragraph is a complete ADR.** Add *Alternatives considered* only when the rejected
  options are worth remembering, and *Consequences* only when a downstream effect is not obvious.
  When *Consequences* is there, it names the downside; a decision with no cost was not a trade-off.
- If new work contradicts an existing ADR, **say so out loud** rather than quietly overriding it.

## Index

| # | Decision | Status |
|---|---|---|
| _(none yet)_ | | |

## Related

- [[_glossary|vault/_glossary]] — vocabulary, not decisions
- `.claude/skills/domain-language/SKILL.md` — the skill that writes these
