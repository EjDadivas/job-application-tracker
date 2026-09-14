---
tags: [backend, testing, convex, fixtures]
related-skill: convex
aliases: ["Backend Testing Fixtures"]
---

# Backend Testing Fixtures

> **Quick Summary**: Tests use `convex-test` to spin up an isolated, in-memory Convex instance per test. Fixtures in `convex/test.setup.ts` progressively seed data so each test asks for exactly as much as it needs. **That file is the only list of fixture names — read it; do not trust one written in a note.** Always pick the narrowest fixture that supports the assertion.

## Content

### The fixture hierarchy

Each layer adds exactly one concept on top of the previous, starting from `setupBase()` — an empty
world with the schema wired up. For the current set and how to choose between them, see
[[fixture-hierarchy]]; for the names, run:

```bash
grep -n '^export' convex/test.setup.ts
```

### A test with `setupBase`

```typescript
import { convexTest } from "convex-test";
import { schema } from "../../schema";
import { modules } from "../../test.setup";

test("unauthenticated read returns null", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.functions.<entity>.getCurrent, {});
  expect(result).toBeNull();
});
```

### A test with a seeded fixture

```typescript
test("an authenticated caller reads the seeded row", async () => {
  const { t, id } = await setupWith<State>();
  const row = await t.withIdentity(memberIdentity)
    .query(api.functions.<entity>.get, { id });
  expect(row).not.toBeNull();
});
```

### Identities

`t.withIdentity(identity)` scopes the call to a specific user. WorkOS identity shape:

```typescript
t.withIdentity({
  subject: "workos-user-id",   // WorkOS User ID
  org_id: "org_456",           // WorkOS Organization ID (omit for no-org context)
  email: "user@example.com",
  email_verified: true,
  name: "Test User",
})
```

Identity constants are exported from `convex/test.setup.ts` and attached at call time — they are
not returned by fixtures, because identity is orthogonal to what the world contains. The template
has no tenancy, so **none of them carries an `org_id`** and the third B-11 test is
cross-**author**: a second fully-provisioned caller acting on the first one's row.

| Caller | How |
|---|---|
| Unauthenticated | `t` raw, no `.withIdentity(...)` |
| Authenticated, never seen before | the newcomer identity constant |
| Authenticated, fully provisioned | the member identity constant |
| A different provisioned caller | the second member identity constant |

Add `org_id` to the shape above only if the project actually grows tenancy. Until then a test that
sets one is asserting against a field no function reads.

### Structure of a fixture

```typescript
// convex/test.setup.ts
export async function setupWith<State>() {
  const base = await setupWith<PreviousState>();
  const id = await base.t.run(async (ctx) => {
    return await ctx.db.insert("<table>", { /* one concept, nothing more */ });
  });
  return { ...base, id };
}
```

Fixtures always extend the previous layer via `...base`.

### Direct DB writes in tests

```typescript
const id = await t.run(async (ctx) => {
  return await ctx.db.insert("items", { /* ... */ });
});
```

`t.run` gives you a `MutationCtx` outside any auth context.

### One test file per source file

```
convex/features/<entity>/
├── queries.public.ts
├── mutations.public.ts
└── tests/
    ├── queries.test.ts
    └── mutations.test.ts
```

## Anti-patterns

> [!warning] ❌ Every test re-seeds its world inline — extend a fixture instead.

> [!warning] ❌ Mocking `ctx.db` — defeats convex-test; tests run against a real in-memory DB.

> [!warning] ❌ Shared fixture state across tests — call the fixture fresh every time.

> [!warning] ❌ Naming a fixture in a doc. The list lives in `convex/test.setup.ts` and nowhere
> else; a copy of it is stale the next time a feature lands.

> [!tip] ✅ Set up, act, assert — three sections per test.

## Related Notes

- [[fixture-hierarchy]] — full selection guide
- [[internal-function-testing]] — testing internals without public entry
- [[access-control-patterns]] — three-test matrix for auth-gated functions
- [[workos-auth-mocking]] — mocking `getAuth()` for route-level tests
- [[feature-folder-layout]] — where tests live
