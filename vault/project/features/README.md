---
tags: [project, feature, convention]
_verified: 2026-09-04
---

# Feature docs — the convention

One file per feature: `vault/project/features/<name>.md`, where `<name>` matches the code folder
(`convex/features/<name>/` and the route folder under `src/routes/`, per F-11). Skipped entirely
when `docs` is `off` in `.claude/project-config.json`.

Start from [[_template|vault/project/features/_template]]. Register it in
[[project/features/_index|vault/project/features/_index]].

## What a feature doc is for

A **stable pointer**, not a mirror of the code. A reader — human or agent — should finish it
knowing what the feature does, who may call what, and which rules bind it, then go read the
code for the rest.

## Rules

1. **Fixed section order** — Purpose, User flow, Public API, RBAC, Conventions pointers, Open
   questions. `/feature-sync` reads and rewrites in this order; reordering breaks it.
2. **No file inventories.** Never list paths or "files touched". Paths change on every refactor
   and nothing checks them, so an inventory is stale the week you write it. Name **exported
   function names** instead — those are what `/feature-sync` can verify against the code.
3. **No code snippets.** If the shape matters that much, it belongs in `vault/tech/`.
4. **Cite rules by ID, never restate them.** Write "B-05" and link
   [[_conventions|vault/_conventions]]. Copying rule text is how the same rule ends up with four
   disagreeing versions.
5. **Date it.** Every doc carries `_verified: <YYYY-MM-DD>` in frontmatter. That turns "is this
   still true?" from an investigation into a lookup.
6. **Delete empty sections.** An "Open questions: None" line reads as unfinished.

## When it gets updated

| Trigger | What to do |
|---|---|
| Feature work ships | `/feature-sync <x>` reconciles Public API and User flow against the code; `/dev` runs it after every hand-off when `docs` is `full` |
| `/feature-sync` with no argument | Lists features whose code changed in the working tree without a doc update |
| A new feature lands with no doc | `/feature-sync <x>` creates it from the template |
| Nothing changed, but the doc is old | Re-read it, then bump `_verified:` |

## Related

- [[_template|vault/project/features/_template]]
- [[project/features/_index|vault/project/features/_index]]
- [[_conventions|vault/_conventions]]
