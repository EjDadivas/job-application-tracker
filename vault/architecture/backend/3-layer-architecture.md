---
tags: [backend, architecture, convex]
related-skill: convex
aliases: ["3-Layer Architecture"]
---

# 3-Layer Architecture

> **Quick Summary**: The Convex backend is organized into three dependency-ordered layers — **Auth** (users, workspaces, memberships) → **Core** (business entities) → **Integrations** (external services). Dependencies flow downward only; upward imports are banned. This keeps each layer's change radius small and makes it obvious where a new feature belongs.

## Content

> Examples below use sample tables (`boards`, `issues`). In this project's actual schema, Core maps to `projects`, `resources`, `threads`, `tags`; Integrations maps to Linear/Asana/Jira sync tables.

### Layers

```
┌───────────────────────────────────────────────┐
│ Layer 1: AUTH                                 │
│   users, workspaces, workspace_memberships    │
│   — Foundation. No dependencies.              │
└───────────────────────────────────────────────┘
                       ↓
┌───────────────────────────────────────────────┐
│ Layer 2: CORE                                 │
│   projects, resources, threads, tags, ...     │
│   — Business logic. Depends on Auth.          │
└───────────────────────────────────────────────┘
                       ↓
┌───────────────────────────────────────────────┐
│ Layer 3: INTEGRATIONS                         │
│   integrations, linear_issues, linear_comments│
│   — External service connections.             │
│   Depends on Core and Auth.                   │
└───────────────────────────────────────────────┘
```

### Allowed import directions

```
Integrations → Core → Auth
```

**Valid:**
```typescript
// Core importing from Auth
import { getCurrentUserId } from "../../auth/users/helpers";

// Integrations importing from Core
import { getBoardByIdOrThrow } from "../../core/boards/helpers";
```

**Invalid:**
```typescript
// ❌ Auth importing from Core — wrong direction
import { boardHelpers } from "../../core/boards/helpers";

// ❌ Core importing from Integrations — wrong direction
import { linearHelpers } from "../../integrations/linear/helpers";
```

### Where to put a new feature

| Feature adds | Layer |
|---|---|
| A new way to authenticate / organize users | Auth |
| A new business entity (document, channel, etc.) | Core |
| A new external service integration | Integrations |

### Data flow per layer

- **Query path**: Frontend → public query → RBAC check → helpers → `ctx.db` read.
- **Write path**: Frontend → public mutation → RBAC check → validation → helpers → `ctx.db` write.
- **External API path**: trigger → action → `fetch` → `ctx.runMutation(internal.*)` → write.

See [[feature-folder-layout]] for the per-feature file structure.

## Anti-patterns

> [!warning] ❌ Auth importing from Core
> Auth is the foundation; anything it imports reverses the dependency graph and creates circular-import hazards the TypeScript compiler will warn about under `"composite": true`.

> [!warning] ❌ Core importing from Integrations
> If Core needs data from an integration, the integration should push it down — usually via a mutation into a Core table — not be imported upward.

> [!tip] ✅ When in doubt, check the table
> If the data belongs to `integrations_*`, it's Integrations. If it belongs to `workspace_memberships`, it's Auth.

## Related Notes

- [[feature-folder-layout]] — per-feature file structure
- [[file-structure-conventions]] — naming conventions
- [[modular-schema]] — how each layer's tables compose into the main schema
- [[api-aggregator-pattern]] — how public functions surface as a flat API
- [[Backend Anti-Patterns Index]] — comprehensive pattern catalog

