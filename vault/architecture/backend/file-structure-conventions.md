---
tags: [backend, architecture, conventions]
related-skill: convex
aliases: ["File Structure Conventions"]
---

# File Structure Conventions

> **Quick Summary**: Folders are kebab-case, files use fixed suffixes — `schema.ts`, `*.public.ts`, `helpers.ts`, `utils.ts`, `types.ts`, `*.test.ts`, `workflows.ts`, `webhooks.ts`. Tests live co-located in a `tests/` subfolder, one test file per source file.

## Content

### Folder naming

| Convention | Example |
|---|---|
| kebab-case | `board-access/`, `status-mappings/` |
| Singular nouns where possible | `board/` (not `boards/`) — but the skill historically uses plurals like `boards/`, follow existing precedent |

### File naming

| Pattern | Purpose |
|---|---|
| `schema.ts` | Table definitions; exports `<feature>Tables` |
| `*.public.ts` | Public API (frontend-facing, surfaces via `api.*`) |
| `*.ts` (without `.public`) | Internal-only (surfaces via `internal.*`) |
| `helpers.ts` | TypeScript utility functions accepting `ctx` |
| `utils.ts` | Pure constants, formatters, builders (no `ctx`) |
| `types.ts` | TypeScript interfaces and type extensions |
| `actions.ts` | Actions (external API calls) |
| `workflows.ts` | Durable workflows |
| `webhooks.ts` | Webhook handlers |
| `triggers.ts` | Cascade delete / side-effect helpers |
| `*.test.ts` | Co-located tests (in `tests/` subfolder) |

### Test file placement

```
convex/features/core/boards/
├── queries.public.ts
├── mutations.public.ts
├── helpers.ts
└── tests/
    ├── queries.test.ts       ← mirrors queries.public.ts
    ├── mutations.test.ts
    └── helpers.test.ts
```

Test naming rule: `<file-being-tested>.test.ts`.

### Shared utilities

Single home for cross-cutting concerns:

```
convex/shared/
├── auth.ts          ← requireAuth (the whole surface today; add authz helpers here)
└── validators.ts    ← reusable argument validators
```

Never duplicate `requireAuth` logic in feature code — import from `../../../shared/auth`.

### When in doubt

- Function accepts `ctx` and reads/writes the DB? → `helpers.ts`
- Function is pure (no `ctx`, no DB)? → `utils.ts`
- Just a type? → `types.ts`
- Called from the frontend? → `.public.ts`
- Called only from other backend code? → `.ts` (internal)

## Anti-patterns

> [!warning] ❌ `util.ts` vs `utils.ts` vs `helpers.ts` — picking a new name each feature
> Standardize. `utils.ts` is pure, `helpers.ts` takes `ctx`. Mixing is confusing and leads to unclear "which file should I add this to" decisions.

> [!warning] ❌ Writing tests at the file's parent folder instead of `tests/`
> Tests live in a subfolder so the feature's source files are clean. Breaking this rule scatters test files throughout the feature.

> [!tip] ✅ Empty `types.ts` with `export {}` is fine
> Keeps the skeleton consistent. Fill it when you need type extensions.

## Related Notes

- [[feature-folder-layout]] — where these files live per feature
- [[public-vs-internal-functions]] — the `.public.ts` split in depth
- [[3-layer-architecture]] — which layer to put a feature in
- [[modular-schema]] — how per-feature `schema.ts` composes

