---
description: Route a prompt as a QUESTION — minimal-context mode, no deep reads
argument-hint: <question>
---

Answer `$ARGUMENTS` in minimal-context mode: do not pre-read `vault/_index.md` or
`vault/_conventions.md` in full; grep first and open only the note that answers it; for a rule ID
read that row only. Prefer a 2–3 sentence answer. If a skill matched in the hook line, treat it as a
pointer and open its SKILL.md only when the answer lives there.

Answer directly: no headers, no verification steps, no summary of what you did. Cite files as
`path:line`.
