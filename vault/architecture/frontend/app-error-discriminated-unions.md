---
title: AppError Discriminated Unions
description: Shared AppError type across Convex backend and frontend — factory helpers, dispatcher, exhaustiveness check
type: tech
tags: [errors, typescript, convex, frontend]
created: 2026-04-27
updated: 2026-04-27
related: [[convex-error-handling]], [[frontend-error-handling]]
aliases: ["AppError Discriminated Unions"]
---

# AppError Discriminated Unions

> **Quick Summary**: Define one shared `AppError` discriminated union so backend `ConvexError` payloads and frontend handlers share a type. Each variant has `code` (discriminator), `message` (user-facing string), and an optional `data` object for extra context. Dispatch on `error.data.code` in a single `handleConvexError(error)` function — every call site stays one line.

## Content

### The shared type

Define in a shared file (e.g. `convex/errors.ts`) so both sides import the same type.

```ts
export type AppError =
  | { code: 'NOT_FOUND'; message: string; data?: { resource: string; id: string } }
  | { code: 'PERMISSION_DENIED'; message: string; data?: { action: string } }
  | { code: 'VALIDATION'; message: string; data?: { field: string } }
  | { code: 'RATE_LIMITED'; message: string; data?: { retryAfter: number } }
  | { code: 'AUTH_EXPIRED'; message: string }
  | { code: 'CONFLICT'; message: string; data?: { reason: string } }
  | { code: 'UNAUTHENTICATED'; message: string }
  | { code: 'FORBIDDEN'; message: string; data?: { requiredRoles?: string[]; actualRole?: string } }
  | { code: 'QUOTA_EXCEEDED'; message: string; data?: { resource: string; max: number } }
  | { code: 'INVALID_TRANSITION'; message: string; data?: { from: string; to: string } };
```

### Factory helpers (optional but useful)

```ts
export const notFound = (resource: string, id: string): AppError =>
  ({ code: 'NOT_FOUND', message: `${resource} not found`, data: { resource, id } });

export const permissionDenied = (action: string): AppError =>
  ({ code: 'PERMISSION_DENIED', message: `You don't have permission to ${action}` });

export const validationError = (field: string, message: string): AppError =>
  ({ code: 'VALIDATION', message, data: { field } });
```

Throw from a Convex function:

```ts
throw new ConvexError(notFound('Client', args.clientId));
```

### Client dispatcher

```ts
import { ConvexError } from 'convex/values';
import { toast } from 'sonner';
import type { AppError } from '@/convex/errors';

export function handleConvexError(error: unknown): void {
  if (error instanceof ConvexError) {
    const appError = error.data as AppError;
    switch (appError.code) {
      case 'RATE_LIMITED':
        toast.error(`Too many requests. Try again in ${appError.data?.retryAfter ?? 60}s`);
        break;
      default: {
        // exhaustiveness check — any new union member without a specific case will show message
        const _exhaustive: AppError = appError;
        toast.error(_exhaustive.message ?? 'An error occurred');
      }
    }
  } else {
    toast.error('An unexpected error occurred');
    console.error('Unhandled error:', error);
  }
}
```

Most errors surface their `message` directly — only add a `case` when the display needs special formatting (e.g. `RATE_LIMITED` with countdown). The `_exhaustive` assignment ensures TypeScript still catches unhandled union members.

## Anti-patterns

> [!warning] ❌ String-typed errors
> ```ts
> throw new ConvexError('not found');
> if (error.message.includes('not found')) // brittle
> ```

> [!tip] ✅ Typed payloads + narrowing on `error.data.code`

## See also

- [[convex-error-handling]] — throw-order pattern on the server
- [[frontend-error-handling]] — catch pattern and `handleConvexError` usage
