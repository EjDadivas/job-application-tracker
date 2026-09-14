---
name: architecture
description: House standards and cross-cutting integration patterns for Convex + TanStack + WorkOS. Use when implementing the integration layer (ConvexProviderWithAuth, feature folder layout, SSR/hydration, error handling across layers, toast notifications), or when someone asks how we do something here, which pattern or layer applies, or why a rule exists.
---

# Architecture (Cross-Cutting Integration)

Content for this skill lives in the Obsidian vault as atomic, wikilinked notes.

**Start here:** `vault/_index.md` (Architecture section)

**Key notes:**

Backend patterns:
- `vault/architecture/backend/function-syntax.md`
- `vault/architecture/backend/public-vs-internal-functions.md`
- `vault/architecture/backend/api-aggregator-pattern.md` — B-18 (pure re-export surface for the frontend)
- `vault/architecture/backend/feature-folder-layout.md` — B-17 (canonical `convex/features/<entity>/` layout)
- `vault/architecture/backend/modular-schema.md` — B-08 (per-feature `schema.ts` exporting `<entity>Tables`, aggregated via spread)
- `vault/architecture/backend/convex-error-handling.md`
- `vault/architecture/backend/resend-component.md`

Frontend patterns:
- `vault/architecture/frontend/convex-react-query-adapter.md`
- `vault/architecture/frontend/convex-tanstack-start-ssr.md`
- `vault/architecture/frontend/frontend-error-handling.md`
- `vault/architecture/frontend/toast-notifications.md`

Auth integration:
- `vault/architecture/auth/workos-authkit-integration.md` — ConvexProviderWithAuth, SSR token injection, callback route; createStart gotchas

**Rules:** `vault/_conventions.md` (B-01…B-18, F-01…F-12, X-01…X-03)

Navigate from `_index.md` — do not read the whole vault.

## Answering a question (`/architecture <question>`, or a "how do we" prompt)

The deliverable is an answer, not a change. Do not edit code or notes.

1. Grep `vault/_conventions.md` for the topic; a matching row gives the rule ID and its Note.
2. Open that note under `vault/architecture/`, and the relevant index under `vault/tech/`
   (`Backend Anti-Patterns Index.md`, `Frontend Anti-Patterns Index.md`) when the question is
   about what to avoid. At most 4 notes.
3. Answer in a few sentences: what we do, the rule ID, the note name that explains it, and the
   rationale from the row. Quote a snippet from the note only when the shape matters.
4. When nothing in the vault settles it, say so and name the closest rule; do not invent a
   standard. The person decides whether it becomes an ADR (`domain-language` skill).
