---
title: WorkOS Auth Mocking
description: Vitest patterns for mocking getAuth() from @workos-inc/authkit — scenario table, reusable factories, user-switching
type: tech
tags: [testing, workos, auth, mocking, vitest]
created: 2026-04-25
updated: 2026-04-27
related: [[access-control-patterns]]
aliases: ["WorkOS Auth Mocking"]
---

# WorkOS Auth Mocking

> **Layer distinction**: This file covers **route-level** auth mocking via `vi.mock('@workos-inc/authkit')` — used in TanStack Start route handler tests. For **function-level** Convex auth testing using `t.withIdentity(...)`, see [[access-control-patterns]].

Use `vi.mock('@workos-inc/authkit')` to mock `getAuth()` at the top of a test file, then `vi.mocked(getAuth).mockResolvedValue(...)` per-test to swap auth state. Factor reusable auth states into `src/test/mocks/workos.ts`.

## Basic mock

```ts
vi.mock('@workos-inc/authkit', () => ({
  getAuth: vi.fn(),
}));
import { getAuth } from '@workos-inc/authkit';
```

## Default auth state (in `beforeEach`)

```ts
beforeEach(() => {
  vi.mocked(getAuth).mockResolvedValue({
    user: { id: 'user_123', email: 'test@example.com' },
    accessToken: 'test-token',
  });
});
```

> `getAuth()` also returns `organizationId`, but **this template reads it nowhere** — there is no
> tenancy. Include it only once the app actually branches on it; a mock that sets a field no code
> reads makes a test look like it covers something it does not.

## Auth scenarios

| Scenario | Mock |
|---|---|
| Authenticated | `{ user: {...}, accessToken }` |
| Unauthenticated | `{ user: null, accessToken: null }` |
| A second, different user | `{ user: { id: 'user_456', ... }, accessToken }` → the cross-author case |
| Expired session | `mockRejectedValue(new Error('Session expired'))` → expect 401 |
| WorkOS API down | `mockRejectedValue(new Error('WorkOS API unavailable'))` → expect 500 |

## Reusable factories (`src/test/mocks/workos.ts`)

```ts
export const mockAuthenticatedUser = (userId = 'user_123') => ({
  user: { id: userId, email: `${userId}@example.com`, firstName: 'Test', lastName: 'User' },
  accessToken: 'mock-token',
});

export const mockUnauthenticatedUser = () => ({
  user: null, accessToken: null,
});

// The cross-author actor for B-11's third test: authenticated, and not the owner.
export const mockOtherUser = () => mockAuthenticatedUser('user_456');
```

When a field can meaningfully be `null` (e.g. `firstName` when a user has no name set), distinguish null from absent using explicit override checks:

```ts
export const createMockWorkOSUser = (overrides: Partial<WorkOSUser> = {}) => ({
  id: overrides.id ?? 'workos-user-id',
  // null = no name; undefined = use default
  firstName: overrides.firstName === undefined ? 'John' : overrides.firstName,
  lastName: overrides.lastName === undefined ? 'Doe' : overrides.lastName,
  email: overrides.email ?? 'john@example.com',
});
```

## User-switching within a test

`mockResolvedValueOnce` consumes one call each:

```ts
vi.mocked(getAuth).mockResolvedValueOnce(mockAuthenticatedUser('user_1'));
vi.mocked(getAuth).mockResolvedValueOnce(mockAuthenticatedUser('user_2'));
```

## User isolation test pattern

```ts
it('user A cannot access user B data', async () => {
  const resourceId = await createResource({ userId: 'user_b' });
  vi.mocked(getAuth).mockResolvedValue(mockAuthenticatedUser('user_a'));
  const response = await APIRoute.GET({
    request: createRequest(`/api/resources/${resourceId}`),
  });
  expect(response.status).toBe(403);
});
```

## Anti-patterns

> [!warning] ❌ Expose WorkOS internals in error responses
> ```ts
> return new Response(`WorkOS error: ${error.message}`, { status: 500 });
> ```

> [!tip] ✅ Generic message to client; log full error server-side
> ```ts
> console.error('WorkOS error:', error);
> return new Response(JSON.stringify({ error: 'Authentication error' }), { status: 500 });
> ```

## See also

- [[access-control-patterns]] — function-level RBAC test matrix (Convex context with `t.withIdentity`)
