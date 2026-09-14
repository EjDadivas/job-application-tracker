---
description: Reconcile vault/project/features/<name>.md against current code
argument-hint: <feature-name> (optional — omit to list features with drift)
---

Reconcile a feature doc against current code. Follow the steps below directly. If `docs` is `off`
in `.claude/project-config.json`, say so and stop; this project does not keep feature docs.

The file you write is read by people. Apply the `unslop` skill's self-audit to the prose before writing it.
## If `$ARGUMENTS` is a feature name (e.g. `/feature-sync sharing`)

1. Read `vault/project/features/$ARGUMENTS.md`. Note the Purpose, User flow, Public API function names, and Open questions.
2. Grep `convex/features/$ARGUMENTS/` (if it exists) for exported `query` / `mutation` / `action` definitions. List the current public function names.
3. Grep `src/routes/` and `src/features/` for `$ARGUMENTS`-related files. Identify the main user-facing surface.
4. Diff: which Public API names in the doc no longer exist in code? Which exist in code but not the doc?
5. Update the doc in place:
   - Fix the Public API section (function names only, no paths)
   - Update the User flow if the UX surface changed
   - Update Conventions pointers if the schema moved
   - Do NOT add file inventories (per `vault/project/features/README.md`)
   - Preserve the fixed section order from `vault/project/features/_template.md`
6. Report: what changed, what's still an Open question, any stale RBAC claims you couldn't verify from code alone.

If `vault/project/features/$ARGUMENTS.md` doesn't exist yet, create it from `vault/project/features/_template.md` and add an entry to `vault/project/features/_index.md`.

## If `$ARGUMENTS` is empty

Run `git diff --name-only HEAD` and scan the output for `convex/features/<x>/**`, `src/features/<x>/**`, or `src/routes/<x>/**` paths. List every feature name that had code changes but no corresponding `vault/project/features/<name>.md` update in the same diff. For each, suggest: `Run /feature-sync <name>`.

## Related

- [[vault/project/features/README]] — doc convention (no inventories, fixed section order)
- [[vault/project/features/_template]] — skeleton structure to follow
