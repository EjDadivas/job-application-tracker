Seed template for `/spec`. Everything below the marker line is the literal file body,
starting with its `---` frontmatter fence.

Copy it, fill the angle-bracket slots, and delete this header. **Do not wrap any part of it in a
code fence.** A bullet too long for one line continues as a plain indented line.

Every section is mandatory. Write "None" only where that is genuinely true and meaningful.

=== TEMPLATE BEGINS ON THE NEXT LINE ===
---
tags: [project, spec]
_verified: <today>
status: draft | agreed | superseded
---

# <Project or feature name> specification

## Problem

What is wrong today, from the user's side. Not the solution.

<Answer "what goes wrong for a person if this is never built?" in the terms the user gave you. A
missing example in the template, an unexercised convention, a scaffold nobody has replaced. None
of these are problems this document solves; they are devkit tickets. If the honest answer is
"I am building this to learn the stack", write that.>

## Users

Who this is for. If there is more than one kind, name each and what they need.

## Required behavior

What it must do. The bulk of the doc. Behaviour, not implementation: "an owner can revoke a
member's access", not "add a revokeAccess mutation". Cover the unhappy paths: empty, unauthorised,
already-done, failed.

Every behaviour that happens **without a person asking for it** names what invokes it and how
often. "On first authenticated load" is a moment, not a trigger: it does not say which surface
calls it, or what happens on the second load. Write "the auth boundary calls it, once per session"
instead. A caller and a frequency are still behaviour, not implementation; omitting them is what
leaves the reader to guess a call site and guess it wrong.

## Architecture

The modules involved and how they fit. Interfaces and contracts. Schema changes and data shape.
No file paths.

## Testing decisions

The seams agreed in Step 3, and why those. Which modules get tested. Prior art: the closest
existing tests in this repo. Cite **B-11** (happy path, unauthenticated, wrong actor) and
**B-12** (assert `err.data.code`, never `err.message`) rather than restating them.

## Non-goals

What we are deliberately **not** doing, and why. This section is the whole reason this document
prevents scope creep. Be specific, and include the tempting adjacent things.

## Acceptance criteria

How we know it is finished. Each one checkable by a person or a command.

- [ ] ...

## Unresolved questions

What is still open, and **what would settle it**. An open question with no resolution path is a
worry, not a question.

## Related

- [[ROADMAP|vault/project/ROADMAP]]
- [[_conventions|vault/_conventions]]
