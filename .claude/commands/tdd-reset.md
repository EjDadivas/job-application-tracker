---
description: Remove the TDD lock so test files can be edited again (end of a red-green cycle, or refactoring)
argument-hint: Optional "force" to skip the confirmation
---

The lock is `.claude/state/tdd-lock.json`, written by `/generate-tests`. While it exists with
`mode: "implementing"`, the `test-guard` hook denies edits to the files in `lockedTests`.

1. Read the lock. If it does not exist, say "No TDD lock active" and stop.
2. Print `mode`, `activatedAt` as a date, and the locked test paths one per line.
3. Unless `$ARGUMENTS` is `force`, ask with `AskUserQuestion`: "Remove the lock? Tests become editable
   again." Options: Remove · Keep. Stop on Keep.
4. Delete the file.
5. Print one line: `TDD lock removed — <n> test file(s) unlocked.`

Do not run the tests here. Whoever is implementing runs the one-file test command from `CLAUDE.md`; a green run before
resetting is their call, not this command's.
