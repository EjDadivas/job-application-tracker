---
description: Generate tests FIRST before implementation (TDD red phase) and lock them
argument-hint: Target file path (e.g. "convex/features/workspaces/mutations.public.ts")
---

You write the tests for `$ARGUMENTS` before the implementation exists, then lock them so the
implementation is made to pass the tests rather than the tests bent to pass the implementation.

## Vault-first (≤4 notes)

1. `vault/_index.md` → the "Writing a test" row.
2. By target location:
   - `convex/` → `vault/architecture/backend/testing/fixture-hierarchy.md`,
     `backend-testing-fixtures.md` (fixture names come from `convex/test.setup.ts`, never from a doc),
     `internal-function-testing.md`, `access-control-patterns.md`.
   - `src/` component or route → `vault/architecture/frontend/testing/tanstack-router-testing.md`,
     `tanstack-query-testing.md`.
   - `src/` hook → `tanstack-query-testing.md` (`renderHook`).
3. Rules B-11 (happy + unauth + wrong-actor trio) and B-12 (assert on `err.data.code`) from
   `vault/_conventions.md`. Cite them: `per [[fixture-hierarchy]]`, `per B-11`.
4. Only then read the target (if it exists) and `convex/test.setup.ts` for Convex targets.

## Process

1. If the target does not exist, that is fine (TDD). If it does, read signatures and auth needs.
2. Test location: Convex → `convex/features/<entity>/tests/<name>.test.ts`; frontend →
   `src/<path>/__tests__/<name>.test.tsx`.
3. Pick the smallest fixture per [[fixture-hierarchy]]; extend an existing one before inventing one.
4. Write the file: happy path → input validation → authorization (B-11 trio) → error handling →
   edge cases. Typed IDs (`Id<"table">`, X-01), never `as any`. Names: `"should <outcome> when <condition>"`.
5. **Lock the tests.** Write `.claude/state/tdd-lock.json` (create the directory if needed):

   ```json
   { "mode": "implementing", "lockedTests": ["<repo-relative test path>"], "activatedAt": <Date.now()> }
   ```

   If a lock already exists, append the new path to `lockedTests` instead of replacing the file.
   The `test-guard` hook now denies edits to those files until `/tdd-reset`.
6. **Red-phase gate.** Do not run the tests in this context. Present three options and stop:
   - Hand to qa-tester — dispatch the `qa-tester` agent with the test path; only a summary returns. Cheapest.
   - Run it yourself with the one-file test command from `CLAUDE.md` § Working here
   - Skip — trust red, verify at green.

## Output

```
Tests written: <test path>  (target: <source path>)
Fixture: <name> — <why, cite the note>
Coverage: happy <n> · validation <n> · auth trio <n> · errors <n> · edge <n>
Locked: yes — /tdd-reset to unlock
Red-phase gate: 1 qa-tester · 2 run yourself · 3 skip
```
