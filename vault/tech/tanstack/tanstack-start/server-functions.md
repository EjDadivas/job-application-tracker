---
tags: [frontend, tanstack, start, server-functions, rpc]
related-skill: tanstack
aliases: ["TanStack Start Server Functions"]
---

# TanStack Start Server Functions

> **Quick Summary**: `createServerFn` is typed RPC between client and server. A GET fn is cacheable + preloadable for data fetching; a POST fn is for mutations. Validators (`.validator(zod)`) give you runtime safety and full TypeScript inference. Return values must be serializable.

## Content

### Basic Server Functions

```typescript
import { createServerFn } from '@tanstack/react-start'

// GET (data fetching, cacheable)
const getUsers = createServerFn()
  .handler(async () => {
    const users = await db.query.users.findMany()
    return users
  })

// POST (mutations, side effects)
const createUser = createServerFn({ method: 'POST' })
  .validator((data: { name: string; email: string }) => data)
  .handler(async ({ data }) => {
    const user = await db.insert(users).values(data).returning()
    return user
  })
```

### With Zod Validation

```typescript
import { z } from 'zod'

const updateUser = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      email: z.string().email(),
    })
  )
  .handler(async ({ data }) => {
    // data is fully typed: { id: string; name: string; email: string }
    return await db.update(users).set(data).where(eq(users.id, data.id))
  })
```

## Pitfalls

- Server functions **cannot close over client-side variables** — they're extracted to separate bundles at build time
- Return data must be serializable (no class instances, no functions, no symbols)
- Forgetting `await` in a loader that calls a server fn leads to streaming issues
- Importing a server fn file that transitively imports server-only modules from a pure client component will break the client build

## Related Notes

- [[TanStack Start Middleware]] — `.middleware([...])` chaining
- [[TanStack Start API Routes]] — when to use an API route vs a server function
- [[Router Data Loading]] — calling server fns from loaders
- [[TanStack Mutations]] — calling server fns from `useMutation`
