---
tags: [conventions, rules, dev-knowledge]
---

# Conventions (Non-Negotiable Rules)

> **Claude: apply these rules to ALL code.** Cite by ID (e.g. "per B-03"). Each row's **Note** column is the canonical explanation.

## Must-know (apply on every feature — check these first)

| ID | Rule |
|---|---|
| B-01 | Every query/mutation/action declares an explicit `args` validator |
| B-02 | Any filter over a field that isn't `_id` or `_creationTime` needs `.withIndex(...)` — never bare `.filter()` |
| B-04 | Never `.collect()` an unbounded table — `.take(N)` or `.paginate()` |
| F-02 | Distinguish `undefined` (loading) / `null` (not found) / data — never collapse to `!data` |
| F-03 | Loader prefetch args must match `useSuspenseQuery` args exactly or you get a cache miss |

## Backend rules (B-01 … B-18)

| ID | Rule | Rationale | Note |
|---|---|---|---|
| B-01 | Every `query`/`mutation`/`action` declares an explicit `args` validator | Runtime input validation at the boundary | [[Function Syntax]] |
| B-02 | Use `.withIndex(...)` for any filter over a field that isn't `_id` or `_creationTime` | `.filter` scans the table; `.withIndex` is ordered/bounded | [[Query Indexing]] |
| B-03 | Compound indexes: equality fields first, range/order field last | Index only works as a prefix; order-by must be the last key | [[Compound Index Ordering]] |
| B-04 | Never `.collect()` an unbounded table — `.take(n)` or `.paginate(...)` | `.collect()` grows with table → OOM / timeout | [[Collect Bounds and Pagination]] |
| B-05 | Public functions open with the auth gate, then any authorization check the project has; internal functions do neither | Three-tier auth model; `internal*` is trusted. This template ships only `requireAuth` — `convex/shared/auth.ts` is the whole surface. A read may be public if the code says why | [[RBAC Helpers]], [[Public vs Internal Functions]] |
| B-06 | If `convex/index.ts` wraps `mutation` via `customMutation` (triggers wired), feature code imports `mutation`/`internalMutation` from `../../../index`. Otherwise `_generated/server` is fine — they're identical until a wrapper exists. | Trigger-wrapping only matters when `customMutation` is in play; the indirection is dead weight without it | [[Database Triggers]] |
| B-07 | No `Date.now()` inside a query | Breaks query cache / reactivity | [[Time and Caching]] |
| B-08 | Schema files per-feature (`convex/features/<entity>/schema.ts` exporting a named `<entity>Tables` object), aggregated in `convex/schema.ts` via spread | Modular; avoids one monster schema file; eliminates merge conflicts | [[Modular Schema]] |
| B-09 | Cascade deletes: inline for small fan-out (<100), scheduled chunked for large | Sync deletes block; workflows handle >100 rows | [[Database Triggers]] |
| B-10 | Workflows must be idempotent | Retries are a fact of life with `@convex-dev/workflow` | [[Workflow]] |
| B-11 | Every protected function has three tests: happy path, unauth, **wrong actor** | Coverage floor for access-controlled surfaces. Wrong actor is cross-tenant where tenancy exists, cross-author where it does not — this template has none | [[Access Control Patterns]] |
| B-12 | Match ConvexError tests on `err.data.code`, not `err.message` | Messages are human-readable; code is stable | [[Access Control Patterns]], [[ConvexError Handling]] |
| B-13 | Use `.unique()` on a compound index for natural-key upserts | Avoids race on duplicate insert | [[Upsert Helpers]] |
| B-14 | Avoid N+1: bulk-fetch via indexed query + `Map`, or `Promise.all` of id lookups | Query-per-item is the #1 perf regression | [[Avoiding N+1]] |
| B-15 | Parallelize workflow steps only when they're independent | `step.runParallel` breaks ordering guarantees | [[Workflow]] |
| B-16 | Use a junction table for every M:N relationship; arrays only when bounded (≤~10), never reverse-queried, and carrying no per-edge metadata | Array fields cannot be indexed — reverse lookup requires a full table scan | [[Relationship Design]] |
| B-17 | Every feature under `convex/features/<entity>/` follows the canonical layout: `schema.ts`, `queries.public.ts` / `mutations.public.ts` for frontend-facing (split by purpose, not by entity name), plain `.ts` for internal; `helpers.ts` takes `ctx`, `utils.ts` is pure; `types.ts` for shared TS, `tests/` for tests | Same shape everywhere → codebase navigable by pattern; public/internal split stays explicit | [[Feature Folder Layout]] |
| B-18 | Frontend-facing surface goes through `convex/functions/<entity>.ts` as **pure re-exports** of `*.public.ts` functions; never re-export internal functions through aggregators and never put logic in aggregator files | Flat `api.functions.<entity>.fn` path for the frontend; internal calls stay traceable at source | [[API Aggregator Pattern]] |

## Frontend rules (F-01 … F-13)

| ID | Rule | Rationale | Note |
|---|---|---|---|
| F-01 | No hook calls after an early return | Rules of hooks — order must be stable | — |
| F-02 | Distinguish `undefined` (loading) / `null` (not found) / real data — never collapse to `!data` | Collapsing shows "not found" during load | [[Preload and Suspense Queries]] |
| F-03 | Loader prefetch args must match the component's `useSuspenseQuery` args exactly | Mismatch → cache miss → suspends again | [[Preload and Suspense Queries]] |
| F-04 | Mutations use `useMutation({ mutationFn: useConvexMutation(api.fn), onSuccess, onError })` | Surfaces `isPending`; integrates with cache | — |
| F-05 | Disable the submit button during `isPending`; don't replace it with a spinner | Preserves focus + keyboard flow | — |
| F-06 | Stable `_id` as list key; never array index | Index-as-key breaks reconciliation on reorder | — |
| F-07 | `import type` for type-only imports | Compiler strips them; runtime stays lean | — |
| F-08 | Don't mix `@/*` and `#/*` in one file | Pick one per file | — |
| F-09 | Use shadcn primitives + `cn()` + Tailwind classes; no inline `style={{ }}`, no hand-rolled styled buttons | Variants, focus, a11y built in; inline styles bypass the token system | — |
| F-10 | Named exports only (routes are the single exception per TanStack codegen) | Easier rename + find-usages | — |
| F-11 | Private colocated components go under a `-folder/` or `-file.tsx` | TanStack Router ignores `-` prefix | — |
| F-12 | Route errors → `errorComponent`; not-found → `notFoundComponent` on the route def, reached with `throw notFound()` | Don't conflate expected vs unexpected; an inline 404 branch skips the router's not-found boundary | — |
| F-13 | Loaders read; they never mutate. Provisioning and other side-effect writes go in a server handler or a one-shot post-auth effect — never in a `loader` | `src/router.tsx` sets `defaultPreload: 'intent'` with `defaultPreloadStaleTime: 0`, so a loader runs on every hover and every SSR pass. A mutation there fires per hover, not once — idempotence hides the bug instead of fixing it | — |

## Cross-cutting (X-01 … X-03)

| ID | Rule | Rationale | Note |
|---|---|---|---|
| X-01 | Use `Doc<"t">` / `Id<"t">` from `convex/_generated/dataModel` on both sides | Single source of truth for row shape | — |
| X-02 | Import Convex api via `convex/_generated/api`; don't alias | Convex tooling expects this path | — |
| X-03 | Cite conventions by ID (e.g., "per B-03") in PRs + session notes | Stable reference across renames | — |

## Documentation lookup

When answering a question or writing code, Claude reads the vault first.

| Situation | Action |
|---|---|
| Topic is covered in vault | Use the vault doc; no external fetch needed |
| Vault doc exists but Claude judges it too thin to answer | Ask: _"The vault doc for X doesn't cover Y — may I use Context7 to fetch the latest docs?"_ |
| Topic has no vault doc at all | Ask: _"I don't have a vault doc for X — may I use Context7 to look it up?"_ |

**Rules:**
- Never call Context7 silently. Always ask permission first.
- If the user says no, proceed with vault + general knowledge only, and note the gap.
- If the user says yes, fetch with Context7 and consider whether the result is worth adding to the vault.

## Enforcement matrix

| Rule                   | Level   | Enforcement                                               |
| ---------------------- | ------- | --------------------------------------------------------- |
| B-01                   | warn    | ESLint `@convex-dev/require-argument-validators`          |
| B-02, B-03, B-04       | warn    | `convex` skill on `convex/**/*.ts`                        |
| B-16                   | warn    | `convex` skill                                            |
| B-05                   | warn    | `convex` skill                                            |
| B-07                   | warn    | skill reminder                                            |
| B-11, B-12             | suggest | `tdd-workflow` skill                                      |
| F-01                   | block   | `eslint-plugin-react-hooks` rules-of-hooks                |
| F-02, F-03, F-04, F-05 | warn    | `tanstack` skill on `src/**/*.tsx`                        |
| F-06                   | warn    | ESLint `react/jsx-key` + skill                            |
| F-09                   | suggest | skill                                                     |
| F-12                   | suggest | skill                                                     |
| F-13                   | warn    | `tanstack` skill on `src/routes/**`                       |
| Doc lookup             | suggest | Convention (no automated hook)                            |

## Related

- [[_index]] — navigation hub
- [[Backend Anti-Patterns Index]]
- [[Frontend Anti-Patterns Index]]
