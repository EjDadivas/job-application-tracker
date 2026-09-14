---
tags: [frontend, anti-patterns, index]
_verified: 2026-09-04
---

# Frontend Anti-Patterns Index

Entry point for frontend anti-patterns. Injected by `BUG_CONTEXT` in
`.claude/hooks/skill-activation-prompt.ts` and cited by `/bug` — start here, then open the
one area file that matches the symptom. Do not read all of them.

## Where to look

| Area | File | Open it when the symptom is |
|---|---|---|
| TanStack | [[TanStack Anti-Patterns]] (`vault/tech/tanstack/`) | Router loader / navigation problems, query cache misses, hydration mismatch, mutation and optimistic-update bugs, SSR errors, form or toast issues, styling |
| WorkOS (client side) | [[WorkOS Anti-Patterns]] (`vault/tech/workos/`) | Auth state flicker, provider wiring, permission checks in the UI |

## Fastest first checks

| Symptom | Suspect rule | Where |
|---|---|---|
| Data refetches on every navigation; loader prefetch does nothing | **F-03** — loader prefetch args must equal the component's `useSuspenseQuery` args | [[TanStack Anti-Patterns]] → Query & Suspense |
| Inline `style={{ }}` or ad-hoc class strings | **F-09** — shadcn primitives + `cn()` + Tailwind | [[TanStack Anti-Patterns]] → Styling |
| 404 rendered as an inline branch inside the component | **F-12** — `notFoundComponent` on the route definition | [[TanStack Anti-Patterns]] → Router |
| Server / client HTML mismatch on first paint | SSR + hydration | [[TanStack Anti-Patterns]] → TanStack Start & SSR |
| `ConvexError` surfaces as a raw string in the UI | Switch on `err.data.code` | [[TanStack Anti-Patterns]] → Error handling & toasts |
| Tailwind class present in source but missing from the build | Split / interpolated class strings are not scanned | [[TanStack Anti-Patterns]] → Styling |

Full rule text: `vault/_conventions.md` (F-01…F-13). This index links; it does not restate the rules.

## Related

- [[Backend Anti-Patterns Index]]
- [[_conventions|vault/_conventions]]
- [[_index|vault/_index]]
