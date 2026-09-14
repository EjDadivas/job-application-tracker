---
title: Fixture Hierarchy
description: How to choose a test fixture, and how to add one without breaking the others
type: tech
tags: [testing, convex, fixtures, tdd]
related: [[backend-testing-fixtures]], [[internal-function-testing]], [[access-control-patterns]]
aliases: ["Fixture Hierarchy"]
---

# Fixture Hierarchy

> **Quick summary**: `convex/test.setup.ts` is the single source of truth for fixtures. **Open it —
> do not trust a list of fixture names written anywhere else, including this note.** Pick the
> narrowest fixture that supports the assertion, and extend an existing one rather than adding a
> sibling.

## Read the file, not this page

This note used to enumerate the fixtures. That list went stale the first time a feature landed, and
an agent then wrote tests against six fixtures that had never existed. A fixture list is generated
data; it belongs in exactly one place.

```bash
grep -n '^export' convex/test.setup.ts
```

That is the current set. Everything below is the shape it follows, which is what actually stays
true.

## The two kinds of export

**Identity constants.** Plain objects passed to `t.withIdentity(...)`. They describe *who is
calling* and seed nothing. There is one per auth state the app distinguishes — at minimum a caller
the system has never seen, a fully-provisioned caller, and a **second** fully-provisioned caller,
which is the actor the third B-11 test needs.

**`setupWith<State>()` functions.** Async, return `{ t, ...ids }`, and seed exactly one more
concept than the fixture they build on. They describe *what exists in the world*.

The split matters: identity is cheap and orthogonal, so it is a constant you attach at call time,
not a fixture you set up. A test that needs an authenticated caller against an empty world uses
`setupBase()` plus an identity constant — it does not need a seeded fixture at all.

## Choosing one

Ask what the assertion actually requires, and take the narrowest answer:

| The assertion needs | Use |
|---|---|
| Nothing seeded — a rejection, a validation error, an empty list | `setupBase()` |
| A caller with a particular auth state | `setupBase()` + the matching identity constant |
| One seeded row of the entity under test | the narrowest `setupWith<State>()` that produces it |
| Two distinct actors — the cross-author test | the fixture that seeds a second one |

A wider fixture is not harmless. It seeds rows that the assertion does not mention, so when it
fails you cannot tell which row caused it, and a later change to the extra seed breaks a test that
never cared about it.

## Adding one

**Extend, do not duplicate.** A new fixture calls the one below it and adds a single concept:

```typescript
export async function setupWithTwoUsers() {
  const base = await setupWithUser();
  // ... seed only the second user
  return { ...base, secondUserId };
}
```

Rebuilding the lower fixture's seed inline means the first actor's shape is now defined in two
places, and they drift. If you find yourself copying five lines out of the fixture below, you
wanted to call it.

**Name it for the world state, not the test.** `setupWithTwoUsers` says what exists;
`setupForCrossAuthorTest` says what one caller wanted and will be wrong for the next one.

**No fixture reads a clock or a random source.** A fixture that seeds `Date.now()` makes every
assertion about ordering flaky under a fast machine.

## Related

- [[backend-testing-fixtures]] — the convex-test mechanics these run on
- [[access-control-patterns]] — the three-test matrix the identity constants exist for
- `vault/_conventions.md` — **B-11** (three tests per protected function), **B-12** (`data.code`)
