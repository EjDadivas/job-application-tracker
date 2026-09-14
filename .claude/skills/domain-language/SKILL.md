---
name: domain-language
description: Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing vault/_glossary.md, or recording or editing an ADR.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the *active* discipline: challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `vault/_glossary.md` for vocabulary is not this skill: that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

## File structure

This repo has a single context, kept in the vault:

```
vault/
├── _glossary.md                      ← the glossary (CONTEXT.md in the original skill)
└── project/
    └── decisions/
        ├── 0001-event-sourced-orders.md
        └── 0002-postgres-for-write-model.md
```

Create entries lazily: only when you have something to write. The glossary file exists with an empty `## Language` section; add the first term when the first term is resolved. Add the first ADR when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `vault/_glossary.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account': do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"

### Update the glossary inline

When a term is resolved, update `vault/_glossary.md` right there. Don't batch these up: capture them as they happen. Use the format in [references/glossary-format.md](./references/glossary-format.md).

`vault/_glossary.md` should be totally devoid of implementation details. Do not treat it as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [references/adr-format.md](./references/adr-format.md).

If what you are about to write contradicts an existing ADR, say so rather than quietly overriding it: "This contradicts [[0003-workspace-scoped-projects]], but it is worth reopening because the tenancy model changed."

## Related

- `vault/_glossary.md` and `vault/project/decisions/` — what this skill writes
- `.claude/skills/grilling/SKILL.md` — grilling resolves the terms this records
- `vault/_conventions.md` — rules, not vocabulary; different file, different job
- Source: Matt Pocock's `domain-modeling` skill, adapted only in paths and the ADR frontmatter
