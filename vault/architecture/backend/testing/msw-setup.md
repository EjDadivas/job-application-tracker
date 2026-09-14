---
title: MSW Setup
description: Mock Service Worker config for intercepting external provider APIs (Asana, Jira) in Vitest — server setup, handler organization, per-test overrides
type: tech
tags: [testing, msw, mocking, vitest]
created: 2026-04-27
updated: 2026-04-27
related: [[internal-function-testing]], [[workos-auth-mocking]]
aliases: ["MSW Setup"]
---

# MSW Setup

> **Quick Summary**: Mock Service Worker intercepts external API calls at the network level so tests can mock providers (Asana, Jira) without real HTTP. Use `onUnhandledRequest: "error"` to catch unmocked calls; reset handlers between tests.

> [!note] Not yet active (as of 2026-04-18): `msw` is **not yet installed** in this repo. Install with `pnpm add -D msw` before using any of these patterns.

## Content

### Install

```bash
pnpm add -D msw
```

### Server configuration

```ts
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Default handlers

```ts
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { asanaHandlers } from './handlers/asana';
import { jiraHandlers } from './handlers/jira';

export const handlers = [...asanaHandlers, ...jiraHandlers];
```

Organize by provider (`handlers/asana.ts`, `handlers/jira.ts`).

### Vitest setup

```ts
// src/test/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    setupFiles: ['src/test/setup.ts'],
    environment: 'node',
  },
});
```

### Per-test override

```ts
it('handles token exchange failure', async () => {
  server.use(
    http.post('https://app.asana.com/-/oauth_token', () =>
      HttpResponse.json(
        { error: 'invalid_grant', error_description: 'Code expired' },
        { status: 400 },
      ),
    ),
  );
  // ... assert error path
});
```

`{ once: true }` on a handler makes it fire only once, then fall back to defaults.

### Request inspection

Capture the outgoing request to verify the client built it correctly:

```ts
let capturedBody: URLSearchParams | null = null;
server.use(
  http.post('https://app.asana.com/-/oauth_token', async ({ request }) => {
    capturedBody = new URLSearchParams(await request.text());
    return HttpResponse.json({ access_token: 'token', expires_in: 3600 });
  }),
);
// ... call handler
expect(capturedBody?.get('grant_type')).toBe('authorization_code');
```

### Error simulation

- **Network error**: `HttpResponse.error()`
- **Timeout**: `await new Promise(r => setTimeout(r, ms))` before returning
- **Rate limit**: return `{ status: 429 }` with `retry_after` body

## Best practices

| Rule | Why |
|---|---|
| `onUnhandledRequest: 'error'` | Forces every external call to be explicitly mocked |
| `afterEach(() => server.resetHandlers())` | Test isolation |
| Organize handlers by provider | Easier to maintain as providers grow |
| Realistic response shapes | Avoid false positives from skimpy mocks |
| Factory helpers (e.g. `createTokenHandler`) | Reduce repetition across tests |

## See also

- [[internal-function-testing]] — DB-write side of OAuth routes
- [[workos-auth-mocking]] — pair MSW with auth mocks
