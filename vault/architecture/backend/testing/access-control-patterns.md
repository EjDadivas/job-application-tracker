---
title: Access Control Test Patterns
description: Mandatory three-test matrix for every protected Convex function — happy path, unauthenticated, wrong actor — with the WorkOS identity shape
type: tech
tags: [backend, testing, convex, rbac, security]
created: 2026-04-25
updated: 2026-09-05
related: [[backend-testing-fixtures]], [[fixture-hierarchy]], [[internal-function-testing]]
aliases: ["Access Control Patterns"]
---

# Access Control Test Patterns

Every public function behind an auth gate needs **three** tests: happy path (the right caller
succeeds), unauthenticated (rejects), and **wrong actor** (rejects). These catch the bugs that make
auth failures silent. Non-negotiable — see **B-11**.

## What "wrong actor" means here

The third test is *a different authenticated caller who must not be able to touch this row*. What
that caller is depends on whether the project has tenancy:

- **With tenancy** — a member of another organization. The bug it catches is a missing
  organization check: a function with `requireAuth` and nothing else passes the first two tests and
  leaks every tenant's data to every other.
- **Without tenancy** — a second signed-in user. The bug it catches is a missing ownership check:
  anyone signed in can edit anyone's row.

**This template has no tenancy.** `convex/shared/auth.ts` exports `requireAuth` and nothing else,
identities carry no `org_id`, and the third test is cross-**author**. Do not write a cross-tenant
test against a schema with no tenant — it will pass for the wrong reason.

## The three required tests

```typescript
describe("get<Resource>", () => {
  test("the owner reads their own row", async () => {
    const { t, id } = await setupWith<State>();
    const result = await t.withIdentity(memberIdentity)
      .query(api.functions.<entity>.get, { id });
    expect(result?._id).toBe(id);
  });

  test("unauthenticated request throws", async () => {
    const { t, id } = await setupWith<State>();
    await expect(
      t.query(api.functions.<entity>.get, { id })
    ).rejects.toMatchObject({ data: { code: "unauthenticated" } });
  });

  test("a different signed-in user cannot touch the row", async () => {
    const { t, id } = await setupWith<State>();
    await expect(
      t.withIdentity(otherMemberIdentity)
        .mutation(api.functions.<entity>.update, { id })
    ).rejects.toMatchObject({ data: { code: "forbidden" } });
  });
});
```

Always assert on `data.code`, never on the message (**B-12**). Every `ConvexError` this codebase
throws carries `{ code, message }` — see `convex/shared/auth.ts` and `src/lib/errors.ts`.

`toMatchObject` on the *rejection* is deliberate: `rejects.toThrow(ConvexError)` passes whether the
cause was a missing session or a missing row, which is exactly the distinction these three tests
exist to draw.

## WorkOS identity shape

`t.withIdentity(...)` accepts a JWT-like object:

```typescript
t.withIdentity({
  subject: "workos-user-id",   // WorkOS User ID — the only field this template reads
  email: "user@example.com",
  email_verified: true,
  name: "Test User",
})
```

Add `org_id` only if the project actually grows tenancy. Until then, setting it asserts against a
field no function reads.

The identity constants live in `convex/test.setup.ts` — **read that file for the current names**; a
list copied into a note is stale the next time a feature lands. What you need is one caller the
system has never seen, one fully provisioned, and a second fully provisioned one for the third test.

| Caller | Expect |
|---|---|
| `t` raw, no `.withIdentity(...)` | `"unauthenticated"` |
| The provisioned identity constant | happy path |
| The second provisioned identity constant | `"forbidden"` |

## Why three?

| Case | Bug it catches |
|---|---|
| Happy path | The function works at all |
| Unauthenticated | The auth gate was forgotten |
| Wrong actor | The ownership check was forgotten → silent data leak |

The third is the dangerous one. The first two pass on a function that authenticates and then
authorizes nothing.

## Role-gated variant (fourth test)

Add a fourth test when a function requires a specific role — a caller who is authenticated,
*is* the right actor, and still lacks the permission:

```typescript
test("a member without the role cannot delete", async () => {
  const { t, id } = await setupWith<State>();
  await expect(
    t.withIdentity(memberIdentity).mutation(api.functions.<entity>.remove, { id })
  ).rejects.toMatchObject({ data: { code: "forbidden" } });
});
```

## What not to test

- Don't re-test `requireAuth` itself in every feature — it has its own tests.
- Don't auth-test internal functions; they run in already-authenticated contexts. See
  [[internal-function-testing]].

## Anti-patterns

> [!warning] ❌ Only a happy-path test
> Ships silent auth bugs. The two rejection tests are non-negotiable.

> [!warning] ❌ Matching error messages by string
> `rejects.toThrow("Unauthorized.")` breaks when you reword the message. Match on `data.code`
> (B-12) — and note the key is `code`, not `kind`.

> [!warning] ❌ A cross-tenant test in a project with no tenants
> It passes because nothing rejects it, and it reads like coverage. Use the second signed-in user.

> [!tip] ✅ TDD this triad
> Write all three first (red), then implement. The rejection tests force you to wire the gate.

## See also

- [[backend-testing-fixtures]] — convex-test wiring and fixture infrastructure
- [[fixture-hierarchy]] — how to choose and extend a fixture
- [[internal-function-testing]] — what NOT to auth-test
- [[workos-auth-mocking]] — mocking `getAuth()` for route-level tests (different layer)
