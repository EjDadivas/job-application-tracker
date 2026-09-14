Seed template for `/roadmap`. Everything below the marker line is the literal file body,
starting with its `---` frontmatter fence.

Copy it, fill the angle-bracket slots, repeat the phase block per phase, delete this header.
**Do not wrap any part of it in a code fence.** The fences you see nowhere in this file are the
point. A criterion too long for one line continues as a plain indented line.

=== TEMPLATE BEGINS ON THE NEXT LINE ===
---
tags: [project, roadmap]
_verified: <YYYY-MM-DD>
---

# <Project> roadmap

Derived from [[SPEC|vault/project/SPEC]]. Tickets live in <tracker>; this file holds phases, not
tasks.

Phases are ordered by what unblocks what. A phase moves to `Complete` only when its **Validation
actually ran and passed**, never when the work feels finished.

## Phase <n>: <name>

**Status:** Not started

### Outcome

<What is true when this phase ends. One or two sentences.>

### Included work

- <Behaviour, not file paths.>

### Dependencies and risks

- <What must exist first.>
- <What could go wrong, and why it is worth naming here.>

### Exit criteria

- [ ] <What must be true before the next phase starts. Checkable, not aspirational.>
- [ ] <A criterion that runs past the line width continues on the next line, indented two
      spaces, as plain text.>

### Validation

- `<test command from CLAUDE.md>`: <which tests, and what a pass looks like>
- `<gen command from CLAUDE.md>`: only if this phase adds or moves a route; rebuilds src/routeTree.gen.ts
- `<lint command from CLAUDE.md>`: tsc and ESLint clean. Required on every phase.
- 🧑 <a check only a person can run, if this phase has one>

## Related

- [[SPEC|vault/project/SPEC]]: what must be true; this file is the order it happens in
- [[_conventions|vault/_conventions]]: the rule IDs cited throughout
- [[_glossary|vault/_glossary]]: the vocabulary both documents are written in
