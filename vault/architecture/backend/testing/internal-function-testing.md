---
tags: [backend, testing, convex, internal]
related-skill: convex
aliases: ["Internal Function Testing"]
---
 @
# Internal Function Testing

> **Quick Summary**: Internal functions don't check auth, so you test them directly against a fresh world. Call via `t.mutation(internal.features.<entity>.mutations.z, args)` — no `withIdentity` needed. Focus tests on the invariants the internal guarantees (idempotency, correct writes) rather than auth, which belongs to the public caller.

## Content

### Calling an internal function from a test

```typescript
import { convexTest } from "convex-test";
import { internal } from "../../_generated/api";
import { schema } from "../../schema";
import { modules } from "../../test.setup";

test("batchUpsert inserts new rows", async () => {
  const { t, ownerId } = await setupWith<State>();
  await t.mutation(internal.features.<entity>.mutations.batchUpsert, {
    ownerId,
    rows: [
      { externalId: "E-1", name: "first" },
      { externalId: "E-2", name: "second" },
    ],
  });
  const rows = await t.run(ctx =>
    ctx.db.query("<table>").withIndex("by_owner", q => q.eq("ownerId", ownerId)).collect());
  expect(rows).toHaveLength(2);
});
```

No `withIdentity` — internals don't consult `ctx.auth`.

### What to assert on an internal function

| Focus | What to test |
|---|---|
| Correct writes | given input X, DB state transitions to Y |
| Idempotency | calling twice = calling once |
| Chunking / pagination | large inputs still complete |
| Side effects | counters updated, triggers fired |

Don't bother with "does it reject unauthenticated callers" — by design it doesn't check.

### Idempotency tests

Always have a test that calls the internal function twice and asserts no duplicates:

```typescript
test("batchUpsert is idempotent", async () => {
  const { t, ownerId } = await setupWith<State>();
  const input = { ownerId, rows: [{ externalId: "E-1", name: "first" }] };
  await t.mutation(internal.features.<entity>.mutations.batchUpsert, input);
  await t.mutation(internal.features.<entity>.mutations.batchUpsert, input);
  const rows = await t.run(ctx =>
    ctx.db.query("<table>").withIndex("by_owner", q => q.eq("ownerId", ownerId)).collect());
  expect(rows).toHaveLength(1);
});
```

### Action testing

Actions call `fetch` — tests mock the external dependency:

```typescript
vi.mock("../../external/third-party-client", () => ({
  fetchExternalItems: vi.fn().mockResolvedValue([/* fixture data */]),
}));
```

## Anti-patterns

> [!warning] ❌ Testing internals only through their public wrapper — you lose coverage of edge cases (large inputs, duplicate keys) the public layer would reject first.

> [!warning] ❌ Re-asserting auth in internal tests — the internal doesn't enforce auth. Auth tests belong on public callers.

> [!warning] ❌ Mocking `ctx.db` — use `t.run` + direct DB writes for setup.

> [!tip] ✅ One test per invariant — name them so each asserts one property.

## Related Notes

- [[backend-testing-fixtures]] — `convex-test` basics
- [[public-vs-internal-functions]] — why internals skip auth
- [[Batch Helpers]] — a common internal under test
