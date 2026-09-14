# Domain docs

Copy into the `## Domain docs` section of `.claude/project-config.md`. This is what tells every
skill where the project's *vocabulary* and *decisions* live, and how to use them.

---

**Vault-housed, single context.** There is no root `CONTEXT.md` and no `docs/adr/`.

| What | Where | Maintained by |
|---|---|---|
| Shared vocabulary | `vault/_glossary.md` | `domain-language`, lazily |
| Decisions / ADRs | `vault/project/decisions/NNNN-<slug>.md` | `/grill`, `domain-language` |
| Knowledge base entry | `vault/_index.md` | by hand |
| Rule set, cited by ID | `vault/_conventions.md` | by hand |

**Use the glossary's word.** When output names a domain concept — a ticket title, a test name, a
type — use the term as `vault/_glossary.md` defines it, not a synonym listed under `_Avoid_`.
Killing that drift is the whole point of the file.

**A missing entry is a signal, not an error.** If the concept isn't there yet, either the language
is being invented (reconsider) or there's a real gap (note it for `domain-language`). If the
glossary or `decisions/` is empty, proceed silently — they fill lazily, and flagging the absence
trains people to ignore the warning.

**Contradicting an ADR is surfaced, never silent:**

> Contradicts ADR-0007 (event-sourced orders), but worth reopening because…

**Never renumber or delete an ADR.** A reversed decision is superseded, not erased: the old file
gets `status: superseded by [[NNNN-…]]`.
