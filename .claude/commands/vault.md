---
description: Add or update a document in the Obsidian vault with proper structure and cross-links
argument-hint: '[tech|project]: <URL, markdown content, or topic>'
---

Parse `$ARGUMENTS` for a `tech:` or `project:` prefix. Default to `tech:` if absent. If `docs` is
`off` in `.claude/project-config.json`, say so and stop; this project does not keep vault notes.

The file you write is read by people. Apply the `unslop` skill's self-audit to the prose before writing it.
## Step 1 — Resolve content

If the input is a URL, fetch and extract the markdown content.
Otherwise use the provided text directly.

## Step 1.5 — Filter against training coverage

Only vault what Claude cannot derive from training. Evaluate the resolved content against these questions:

- Does this mirror the library's official getting-started / API reference? → **Skip** (training covers it).
- Is this a standard hook/pattern (`useQuery`, `createFileRoute`, `withIndex`, basic validators)? → **Skip**.
- Is this a stub or "TBD" placeholder? → **Skip**.

Keep only if at least one applies:

- Project-specific architecture, naming, or folder conventions
- Non-obvious integration between two libs (e.g. Convex ↔ TanStack Query adapter behaviour)
- A decision that overrides the library's defaults, with the reasoning
- Concrete numbers, limits, or error-message dispatch tables Claude tends to hallucinate
- Reference info that would otherwise require grepping the codebase (import paths, error boundary locations)

**Mixed content:** extract the project-specific subset, discard the rest. Don't vault a 2000-word doc for three useful lines.

**Pure standard ref:** do not create the file. Stop here and report: _"Skipping — \<library\> docs cover this. The stack declaration in `CLAUDE.md` is enough for Claude to apply it."_

## Step 2 — Pick target path

- `tech:` → `vault/tech/<subcategory>/` — match the closest existing subfolder or create a new one:
  - `vault/tech/convex/` — Convex backend. Sub-folders and what belongs in each:
    - `schema-design/` — table definitions, validators, relationship modeling (junction vs array), index column declaration, `convex-helpers` relationship API. If the doc is about _authoring_ a schema or deciding how data is structured, it goes here.
    - `performance/` — query execution: `.withIndex()` usage, hot-path rules, subscription cost, function budget, OCC conflicts, time-based caching. If the doc is about _running_ queries or hitting limits, it goes here.
    - `helpers/` — runtime helper patterns: list helpers, upsert, lookup, batch, validation, helper function conventions. Relationship traversal helpers belong in `schema-design/` instead.
    - `migrations/` — schema migration patterns and the migrations Convex component.
    - `best-practices/` — production checklists and official Convex guidelines that span multiple concerns.
    - `test/` — testing patterns, fixtures, internal function testing.
    - `auth/` — authentication setup and overview.
    - `setup/` — provider-specific auth setup guides (WorkOS).
    - `components/` — Convex components (reusable backend units).
  - `vault/tech/tanstack/` — TanStack. Sub-folders and what belongs in each:
    - `tanstack-router/` — route definitions, type safety, navigation, data loading via `loader`/`loaderDeps`.
    - `tanstack-query/` — React Query hooks, mutations, `useSuspenseQuery`, query invalidation, mutation feedback UX (toast patterns).
    - `tanstack-start/` — TanStack Start framework: SSR, server functions, middleware, API routes, deployment.
  - `vault/architecture/` — cross-cutting docs that span multiple technologies. Sub-folders:
    - `backend/` — Convex code structure: feature folder layout, function syntax, public vs internal functions, API aggregator pattern, error handling. Use this (not `convex/`) for docs about _how the backend is organized_.
    - `frontend/` — full-stack integration wiring: `ConvexQueryClient` setup, `convexQuery` adapter, SSR + Convex loader patterns, `ConvexError` handling on the frontend, toast notifications.
    - `auth/` — cross-stack auth integration (e.g. WorkOS AuthKit wiring across frontend + backend). Provider setup lives in the `setup-project` skill, not the vault.
  - `vault/tech/workos/` — WorkOS-specific docs (beyond auth setup).
- `project:` → `vault/project/`:
  - `vault/project/features/` for feature docs (follow `vault/project/features/_template.md`)
  - `vault/project/decisions/` for ADRs
  - `vault/project/docs/` for everything else: diagrams, user flows, reports, presentations

**File naming:** kebab-case, under 50 chars. Examples: `query-indexing.md`, `route-definitions.md`.

## Step 3 — Dedup check

Grep existing `.md` file titles in the target directory. If a file already covers this topic, update it in place instead of creating a duplicate.

## Step 4 — Apply frontmatter

**Copy `.claude/templates/vault-note.md`** — everything below the marker line, starting with its
`---` fence. If it is missing, say so and stop.

Both `---` fences are required; a missing closing fence turns the block into body text and Obsidian
indexes nothing. The only code fences in the finished note are around actual code samples.

## Step 5 — Split if large

If content exceeds ~1500 words, create a parent overview file plus sub-files linked via `[[wikilinks]]`.

## Step 6 — Cross-link

Grep existing file titles in the same vault area. Add a `## See also` section with `[[wikilinks]]` to related notes.

## Step 6.5 — Update `_conventions.md` and `_index.md` (if applicable)

- **`vault/_conventions.md`**: If the new note establishes or formalises a rule (a pattern that should always or never be used), add a numbered rule row (next B-NN / F-NN / X-NN) citing the new note. Also add the rule ID to the Enforcement matrix.
- **`vault/_index.md`**: Add the new note(s) to both the relevant "By task" table row(s) and the "By area" section so future navigators can discover them.

## Step 7 — Update skill KeyNotes (if applicable)

If the new file belongs to a skill's domain, add it to the **Key notes** list in the relevant skill:

- Convex backend → `.claude/skills/convex/SKILL.md`
- TanStack frontend → `.claude/skills/tanstack/SKILL.md`
- TDD / testing → `.claude/skills/tdd-workflow/SKILL.md`
- Error tracking → `.claude/skills/error-tracking/SKILL.md`

## Step 8 — Confirm

Output the created/updated file path(s) and a one-line preview of the title and description — or, if filtered out at Step 1.5, the reason for the skip.
