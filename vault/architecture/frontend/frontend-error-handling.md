---
tags: [frontend, tanstack, convex, errors, error-handling, typescript]
related-skill: tanstack
aliases: ["Frontend Error Handling"]
---

# Frontend Error Handling — Convex

> **Quick Summary**: Convex surfaces backend `ConvexError` payloads on the client via `error.data` — use `instanceof ConvexError` to type-narrow, then extract the message from `error.data`. Unexpected (non-Convex) errors should always be logged and shown as a generic message.

## How Convex surfaces errors

When a Convex function throws `new ConvexError(payload)`, the client receives it as a regular JS `Error` with:
- `error instanceof ConvexError` → `true`
- `error.data` → the exact payload you threw (string or object)
- `error.message` → JSON-stringified wrapper — **do not use this for display**

Errors that are not `ConvexError` (unexpected crashes, network failures) arrive as plain `Error` objects.

---

## The basic catch pattern

```tsx
import { ConvexError } from 'convex/values'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'

const updateClient = useMutation(api.clients.update)

try {
  await updateClient({ id, name })
  toast.success('Saved')
} catch (error) {
  if (error instanceof ConvexError) {
    handleConvexError(error)
  } else {
    console.error('Unexpected error:', error)
    toast.error('Something went wrong')
  }
}
```

---

## `handleConvexError` — message extractor

Extract `message` from `error.data` and show it as a toast. The `{ code, message, data? }` payload shape means `message` is always the user-facing string; the `code` discriminator is for programmatic handling only.

```ts
// src/lib/errors.ts
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

export function handleConvexError(error: ConvexError<unknown>): void {
  const { data } = error
  const message =
    typeof data === 'string' ? data :
    typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message: unknown }).message)
      : 'Something went wrong'
  toast.error(message)
}
```

For cases that need dispatch on `code` (e.g. `RATE_LIMITED` with a countdown), see [[app-error-discriminated-unions]] for the full dispatcher.
```

---

## When to toast vs log vs re-throw

| Scenario | Action |
|---|---|
| `ConvexError` with typed payload | Dispatch via `handleConvexError` → toast |
| `ConvexError` with string payload | `toast.error(error.data)` |
| Unexpected (non-Convex) error | `console.error` + generic `toast.error` |
| Error in a query (render-time) | TanStack Router `errorComponent` catches it — no toast needed |
| Error you need to surface to parent | Re-throw after logging |

---

## Anti-patterns

> [!warning] ❌ Reading `error.message` for display
> ```ts
> toast.error(error.message) // "Uncaught ConvexError: {\"code\":\"NOT_FOUND\",...}"
> ```

> [!tip] ✅ Read `error.data`
> ```ts
> const data = error.data
> toast.error(typeof data === 'string' ? data : (data as any).message ?? 'Error')
> ```

> [!warning] ❌ Catching everything silently
> ```ts
> catch (error) { /* do nothing */ }
> ```
> Swallowed errors make debugging impossible. At minimum, `console.error`.

> [!warning] ❌ One generic toast for all `ConvexError`s
> ```ts
> if (error instanceof ConvexError) toast.error('Something went wrong')
> ```
> You lose all the message context the backend provided.

---

## See also

- [[convex-error-handling]] — backend throw patterns (auth → validate → fetch → authorize → act)
- [[toast-notifications]] — Sonner integration patterns
