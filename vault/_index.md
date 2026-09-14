---
tags: [index, navigation, dev-knowledge]
aliases: ["index"]
---

# Dev Knowledge — Navigation Hub

> **Claude: read this file first, then navigate selectively.** Do NOT read every note — pick at most ~4 notes per task from the table below.

## Start here

- [[_conventions]] — all hard rules, numbered for citation (B-01, F-03, X-01…)
- Anti-patterns (colocated in `tech/<area>/`): [[Convex Anti-Patterns]] · [[TanStack Anti-Patterns]] · [[WorkOS Anti-Patterns]] · [[Resend Anti-Patterns]] · indexes: [[Backend Anti-Patterns Index]] · [[Frontend Anti-Patterns Index]]
- Convex philosophy: [[Zen of Convex]] — queries first, actions sparingly, record progress one step at a time

## By task

| When you're…                             | Read                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writing a Convex query                   | [[Function Syntax]], [[Query Indexing]], [[Compound Index Ordering]], [[Collect Bounds and Pagination]], [[Avoiding N+1]]                               |
| Writing a Convex mutation                | [[Function Syntax]], [[Database Triggers]], [[Helper Functions]]                                                                                        |
| Writing a Convex action                  | [[Function Syntax]], [[Workflow]], [[HTTP Routes & Webhooks]]                                                                                           |
| Queuing / throttling async work          | [[Workpool]], [[Action Retrier]], [[Crons]]                                                                                                             |
| Designing a schema                       | [[Modular Schema]], [[Schema Patterns]], [[Relationship Design]], [[Public vs Internal Functions]]                                                      |
| Optimizing a slow query                  | [[Query Indexing]], [[Compound Index Ordering]], [[Avoiding N+1]], [[Time and Caching]], [[Hot Path Rules]], [[Function Budget]]                        |
| Hitting OCC conflicts / write contention | [[OCC Conflict Resolution]], [[Hot Path Rules]]                                                                                                         |
| Sluggish UI from too many subscriptions  | [[Subscription Cost]], [[Function Budget]]                                                                                                              |
| Migrating a Convex schema                | [[Migration Workflow]], [[Migration Patterns]], [[migrations-component]]                                                                                |
| Securing a function (auth basics)        | [[Auth Overview]], [[RBAC Helpers]], [[Public vs Internal Functions]]                                                                                   |
| Adding a route                           | [[Router Data Loading]], [[Router Navigation]], [[Router Type Safety]]                                                                                  |
| Loading data in a route                  | [[Router Data Loading]], [[Preload and Suspense Queries]]                                                                                               |
| Fetching data in a component             | [[Preload and Suspense Queries]], [[Convex React Query Adapter]]                                                                                        |
| Mutating data                            | [[TanStack Mutations]], [[TanStack Start Server Functions]], [[Convex React Query Adapter]]                                                             |
| Handling errors                          | [[ConvexError Handling]], [[AppError Discriminated Unions]], [[Frontend Error Handling]]                                                                |
| Writing a test (backend)                 | [[Backend Testing Fixtures]], [[Fixture Hierarchy]], [[Internal Function Testing]], [[Access Control Patterns]], [[WorkOS Auth Mocking]], [[MSW Setup]] |
| Writing a test (frontend)                | [[TanStack Router Testing]], [[TanStack Query Testing]]                                                                                                 |
| Adding a server function / SSR route     | [[TanStack Start Setup]], [[TanStack Start Server Functions]], [[TanStack Start Middleware]], [[TanStack Start Best Practices]]                         |
| Setting up WorkOS auth (TanStack Start)  | [[WorkOS AuthKit + Convex + TanStack Start Integration]], [[workos-authkit-sdk-reference]]                                                              |
| Sending an email from a Convex action    | [[tech/resend/overview]], [[sdk-patterns]], [[react-email]]                                                                                             |
| SSR with Convex data                     | [[Convex + TanStack Start — SSR & Loaders]], [[Convex React Query Adapter]]                                                                             |
| Deploying the Start app                  | [[Convex on Netlify]], [[TanStack Start Deployment]], [[TanStack Start Setup]]                                                                          |
| Netlify deploy previews with Convex      | [[Convex on Netlify]]                                                                                                                                  |

## By area

Each area is owned by a skill; the skill is the entry point and links the notes it needs.

- Convex backend → `.claude/skills/convex/SKILL.md`
- Frontend (TanStack) → `.claude/skills/tanstack/SKILL.md`
- Architecture / integration → `.claude/skills/architecture/SKILL.md`
- Auth (WorkOS) → `.claude/skills/workos/SKILL.md`
- Testing → `.claude/skills/tdd-workflow/SKILL.md`
- Email (Resend) → `.claude/skills/resend/SKILL.md`
- PostHog → `vault/tech/posthog/` (no skill yet)
- Project docs (features, decisions, diagrams and reports) → [[project/features/_index]] · `vault/project/decisions/` · `vault/project/docs/`

## External references

- [tanstack-skills](https://github.com/tanstack-skills/tanstack-skills) — upstream source. Router / Query / Start are mirrored in `vault/tech/tanstack/`. Other TanStack packages (form, table, virtual, pacer, store, ranger, db, ui, devtools) are consulted, not mirrored — go to the upstream SKILL.md when needed.

## Frontmatter

Two shapes are in use and both are accepted:

- `tags` / `aliases` (optionally `related-skill: <skill dir name>` and `source`) — the shorter form most tech notes use.
- `title` / `type` / `description` / `tags` / `created` / `updated` (optionally `related`, `source`, `aliases`) — the fuller form most architecture notes use.

Link by basename (`[[Query Indexing]]` resolves via `aliases`); where a basename is duplicated (`agent-surface`, `overview`, `_index`, `README`) link by path (`[[tech/workos/agent-surface]]`).
