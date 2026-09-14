---
tags: [backend, architecture, convex, conventions]
related-skill: convex
aliases: ["Feature Folder Layout"]
---

# Feature Folder Layout

> **Quick Summary**: Every feature lives under `convex/features/<entity>/` with a fixed internal structure — `schema.ts`, `*.public.ts`, optional internal `*.ts`, `helpers.ts`, `utils.ts`, `types.ts`, and a `tests/` folder. Same shape everywhere so the codebase is navigable by pattern.

## Content

### Canonical feature layout

```
convex/features/<entity>/
├── schema.ts              ← table definitions; exports <entity>Tables
├── queries.public.ts      ← public queries (frontend-facing)
├── mutations.public.ts    ← public mutations
├── queries.ts             ← internal queries (backend-only)
├── mutations.ts           ← internal mutations
├── actions.ts             ← external API calls
├── helpers.ts             ← TS functions taking ctx
├── utils.ts               ← pure constants / builders / formatters
├── types.ts               ← TS interfaces, type extensions
└── tests/
    └── *.test.ts
```

Not every file is required — omit what's unused. Optional: group features under a `<layer>/` folder (e.g. `features/<layer>/<entity>/`) when the codebase has distinct layers.

### Example

```
convex/features/<entity>/
├── schema.ts
├── queries.public.ts      # getItem, listItems
├── mutations.public.ts    # createItem, updateItem, deleteItem
├── helpers.ts             # getItemByIdOrThrow
├── types.ts               # ItemWithDetails
└── tests/
    └── queries.test.ts
```

### Top-level `convex/` layout

```
convex/
├── _generated/            ← auto — never edit
├── schema.ts              ← spreads all feature tables
├── http.ts                ← HTTP routes (webhooks)
├── crons.ts               ← scheduled jobs
├── functions/             ← API aggregators — see [[api-aggregator-pattern]]
├── features/
│   ├── <entity-a>/
│   └── <entity-b>/
└── shared/
    └── validators.ts      ← reusable validators
```

### Import conventions

Within the same feature — relative:
```typescript
import { getItemByIdOrThrow } from "./helpers";
import type { ItemWithDetails } from "./types";
```

Cross-feature — up-and-over:
```typescript
import { getItemByIdOrThrow } from "../<other-entity>/helpers";
```

Shared utilities:
```typescript
import { validators } from "../../shared/validators";
```

Generated code:
```typescript
import { query, mutation, internalMutation } from "../../_generated/server";
import type { Id, Doc } from "../../_generated/dataModel";
import { api, internal } from "../../_generated/api";
import { v } from "convex/values";
```

### When in doubt

- Function accepts `ctx` and reads/writes the DB? → `helpers.ts`
- Function is pure (no `ctx`, no DB)? → `utils.ts`
- Just a type? → `types.ts`
- Called from the frontend? → `.public.ts`
- Called only from other backend code? → `.ts` (internal)
- Third-party SDK / fetch wrapper (no `ctx`, not pure)? → named module e.g. `airtable.ts`, `resend.ts` — makes `vi.mock("../airtable")` clean and signals the integration boundary

### Multiple tables in one feature

A feature can own more than one table — the table count doesn't change the layout. All of the feature's `internalQuery`/`internalMutation` exports go into the feature's single `queries.ts` / `mutations.ts`, regardless of which table they touch. Prefix the export name with the table when needed to disambiguate (e.g. `getItem` / `archiveItem` alongside `getItemTag` / `attachItemTag`).

Do **not** create a per-table subfolder (`<entity>/<secondary-table>/queries.ts`) — feature folders are flat. Subfolder nesting is reserved for the optional `<layer>/<entity>/` split, not for tables within a feature.

## Anti-patterns

> [!warning] ❌ Dumping everything into one `index.ts` — obscures the public/internal split.

> [!warning] ❌ Naming a feature after a verb. Features are nouns (`<entity>/`), actions go inside `actions.ts`.

> [!warning] ❌ Mixing `util.ts` / `utils.ts` / `helpers.ts` per feature. Standardize: `utils.ts` is pure, `helpers.ts` takes `ctx`.

> [!tip] ✅ Empty `types.ts` with `export {}` is fine — keeps the skeleton predictable.

## Related Notes

- [[public-vs-internal-functions]] — the `.public.ts` split
- [[api-aggregator-pattern]] — how public functions surface under `api.functions.*`
- [[modular-schema]] — how `schema.ts` per feature composes
