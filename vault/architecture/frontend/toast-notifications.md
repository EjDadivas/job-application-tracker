---
tags: [frontend, tanstack, convex, toast, sonner, mutations, ux]
related-skill: tanstack
aliases: ["Toast Notifications"]
---

# Toast Notifications — After-Operation Feedback

> **Quick Summary**: Use Sonner's `toast.success` / `toast.error` at the mutation call site — after an operation resolves or rejects. Read the user-facing message from `error.data.message`, not `error.message`. Use `toast.promise()` when you want an automatic loading state but don't need to read the resolved value.

## Basic pattern — try/catch after a mutation

`useMutation` returns an async function. Fire `toast.success` on resolve; delegate error extraction to `handleConvexError`.

```tsx
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { handleConvexError } from '@/lib/errors'

function CreateClientForm() {
  const createClient = useMutation(api.clients.create)

  async function handleSubmit(name: string) {
    try {
      await createClient({ name })
      toast.success('Client created')
    } catch (error) {
      if (error instanceof ConvexError) {
        handleConvexError(error)
      } else {
        console.error('Unexpected error:', error)
        toast.error('Something went wrong')
      }
    }
  }

  return <button onClick={() => handleSubmit('Acme Corp')}>Create</button>
}
```

---

## `toast.promise()` — automatic loading state

Pass the mutation call directly to `toast.promise()`. The `error` callback receives the thrown error.

```tsx
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'

function DeleteButton({ id }: { id: Id<'items'> }) {
  const deleteItem = useMutation(api.items.remove)

  function handleDelete() {
    toast.promise(deleteItem({ id }), {
      loading: 'Deleting...',
      success: 'Item deleted',
      error: (error) => {
        if (error instanceof ConvexError) {
          const data = error.data as { message?: string } | string
          return typeof data === 'string' ? data : data?.message ?? 'Delete failed'
        }
        return 'Something went wrong'
      },
    })
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

---

## Anti-patterns

> [!warning] ❌ `toast.error(error.message)` — always shows the internal wrapper message
> `ConvexError` wraps the payload in `.message` as JSON. Read `.data` instead.

> [!tip] ✅ Always read `error.data.message`
> ```tsx
> const data = error.data as { message?: string } | string
> toast.error(typeof data === 'string' ? data : data?.message ?? 'Error')
> ```

> [!warning] ❌ Firing toast in a shared utility called from many places
> Multiple callers = duplicate toasts. Keep `toast.*` calls at the call site.

> [!warning] ❌ Using `toast.promise()` when you need to read the result
> `toast.promise()` is fire-and-forget. If you need to act on the resolved value (navigate, update local state), use try/catch instead.

---

## See also

- [[convex-error-handling]] — backend throw patterns and typed payloads
- [[frontend-error-handling]] — full dispatcher pattern
