---
name: tdd-workflow
description: Test-driven development for Convex + TanStack with Vitest and convex-test. Use when writing or generating tests, running a red-green loop, choosing a fixture, testing RBAC and wrong-actor access, or asserting on a ConvexError.
---

# TDD Workflow

Content for this skill lives in the Obsidian vault as atomic, wikilinked notes.

**Start here:** `vault/_index.md` (Reference section)

**Backend testing notes:**

- `vault/architecture/backend/testing/backend-testing-fixtures.md`
- `vault/architecture/backend/testing/fixture-hierarchy.md`
- `vault/architecture/backend/testing/internal-function-testing.md`
- `vault/architecture/backend/testing/access-control-patterns.md` — three-test matrix (happy path, unauth, wrong actor) + WorkOS identity shape
- `vault/architecture/backend/testing/workos-auth-mocking.md` — vi.mock getAuth(), scenario table, reusable factories, user-switching

**Frontend testing notes:**

- `vault/architecture/frontend/testing/tanstack-router-testing.md`
- `vault/architecture/frontend/testing/tanstack-query-testing.md`

**Rules:** `vault/_conventions.md` (B-11, B-12)

Navigate from `_index.md` — do not read the whole vault.
