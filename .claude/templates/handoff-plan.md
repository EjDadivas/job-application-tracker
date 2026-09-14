Seed template for `/handoff-to-agent` → `vault/project/in-progress/<name>/plan.md`. Everything below the marker line is the literal file body,
starting with its `---` frontmatter fence.

Copy it, fill the angle-bracket slots, and delete this header. **Do not wrap any part of it in a
code fence** — the output file contains no fences at all. A line too long to fit continues as a
plain indented line.

=== TEMPLATE BEGINS ON THE NEXT LINE ===
---
title: <Title Case Name>
status: in-progress
created: <today's date YYYY-MM-DD>
TDD: <no | yes — tests at <path>>
size: <small | large>
---

# <Title>

## Purpose
<1–2 sentences from WHAT (or REPRO+EXPECTED for bugs)>

## Surface (WHERE)
<area / module / route — e.g. "convex backend, the billing entity" — NOT specific filenames>

## Role / permissions (WHO)
<owner / member / guest / public — and which functions need which>

## Acceptance criteria
1. <concrete success scenarios from ACCEPTANCE; each one independently testable>

## Rule IDs in scope
- B-xx — <one-line label>
- F-xx — <one-line label>

## Discovery references
<files the parent already inspected during bounded discovery, one per line with a one-line "what it answers". Examples:
- `convex/features/<sibling>/mutations.public.ts` — handler signature + import pattern
- `convex/_generated/server.d.ts` — typed `mutation`/`query` builders to import from
- `vault/architecture/backend/feature-folder-layout.md` — folder skeleton (B-17)

If discovery was greenfield (no siblings exist), write: `Greenfield — no sibling code; rely on vault/architecture/backend/feature-folder-layout.md and vault/_conventions.md.`

If nothing was inspected, omit the section.>

## Out of scope
- <bounded list>

## Open questions
- <only if any>
