# Issue tracker: local markdown

Copy into the `## Issue tracker` section of `.claude/project-config.md`. Keep it this short —
the folders below are the whole convention.

---

**Local markdown**

Tickets are files in `vault/project/in-progress/`. Finishing one means moving it to
`vault/project/done/`; that move is the only record of state.

- **Create** — a folder `vault/project/in-progress/<kebab-name>/` holding `plan.md` and, once handed
  off, `tasks.md`. Name it after the change, not a number.
- **Fetch** — read the file. There is nothing to query.
- **Sub-issues** — the numbered lines in `tasks.md`.
- **Blocked by** — a `## Blocked by` heading listing blockers as `[[wikilinks]]`.

`/linear` does not apply to this repo.
