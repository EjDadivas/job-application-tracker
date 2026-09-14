---
tags: [frontend, tanstack, start, middleware, auth]
related-skill: tanstack
aliases: ["TanStack Start Middleware"]
---

# TanStack Start Middleware

> **Quick Summary**: `createMiddleware().handler(async ({ next }) => ...)` wraps a server function. Each middleware can throw (redirect/error), mutate the request, or pass typed context to the next handler via `next({ context })`. Chain via `.middleware([other])` — contexts accumulate and stay typed end-to-end.

## Content

### Basic Middleware

```typescript
import { createMiddleware } from '@tanstack/react-start'

const loggingMiddleware = createMiddleware().handler(async ({ next }) => {
  console.log('Request started')
  const result = await next()
  console.log('Request completed')
  return result
})
```

### Auth Middleware with Context

```typescript
const authMiddleware = createMiddleware().handler(async ({ next }) => {
  const request = getWebRequest()
  const session = await getSession(request)

  if (!session?.user) {
    throw redirect({ to: '/login' })
  }

  // Pass typed context to handler
  return next({ context: { user: session.user } })
})
```

### Chaining Middleware

```typescript
const adminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .handler(async ({ next, context }) => {
    // context.user is typed from authMiddleware
    if (context.user.role !== 'admin') {
      throw redirect({ to: '/unauthorized' })
    }
    return next({ context: { isAdmin: true } })
  })

// Usage on a server function
const adminAction = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .handler(async ({ context }) => {
    // context: { user: User; isAdmin: boolean }
    return { success: true }
  })
```

## Related Notes

- [[TanStack Start Server Functions]] — what middleware wraps
- [[Router Data Loading]] — `beforeLoad` is the route-level analogue
- [[TanStack Start API Routes]] — API routes are middleware-less; use a different composition pattern
