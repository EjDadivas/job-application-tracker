---
tags: [glossary, reference]
_verified: 2026-09-05
---

# Glossary

The project's shared vocabulary. **One word per concept.** When several words exist for one thing,
this file picks the winner and lists the rest under `_Avoid_` — that line is the point of the
document, because it is what stops the drift.

Maintained by the `domain-language` skill, **lazily**: a term lands here when it is actually
resolved in a discussion, never as an upfront naming exercise.

## What belongs here

Terms **specific to this project**. Ask: *is this concept unique to us?*

- ✅ **Post**, **Handle**, **Repost** — mean something particular here
- ❌ debounce, optimistic update, cache miss — general programming concepts, however often we say
  them

Definitions are one or two sentences and say what a thing **is**, not what it does. No
implementation details, no file paths — those go in `vault/project/SPEC.md` or `vault/tech/`.

---

## Language

> **Empty on purpose.** Terms get added as they are resolved, not up front. Run `/grill` (or
> `/spec`) on a piece of work and the `domain-language` skill adds an entry here the moment a term
> actually gets pinned down.
>
> Format:
>
> ```markdown
> **Workspace**:
> The billing and access boundary. Every member and invite belongs to exactly one.
> _Avoid_: org, organisation, team, account
> ```

---

## Related

- [[_conventions|vault/_conventions]] — the **rules**. Different job: this file settles what words
  mean, that one settles how code is written
- `vault/project/decisions/` — ADRs, for decisions rather than vocabulary
- `.claude/skills/domain-language/SKILL.md` — the skill that maintains this
