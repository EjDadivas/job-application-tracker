# Issue tracker: GitHub Issues

Copy into the `## Issue tracker` section of `.claude/project-config.md`.

---

**GitHub Issues** — `<owner>/<repo>`, via the `gh` CLI.

- **Create** — `gh issue create --title <t> --body-file <f>`. Prefer `--body-file`; a long
  `--body` on one shell line gets mangled.
- **Fetch** — `gh issue view <n> --json title,body,labels,state`.
- **Sub-issues** — a task list in the parent body (`- [ ] #124`). GitHub renders progress from it.
- **Blocked by** — no native relation. State it in the body under `## Blocked by` and label the
  issue `blocked`.
- **Mirror** — none. `/linear` is Linear-only (it calls the Linear MCP), so there is no command
  that pulls a GitHub issue into the vault. Write the plan doc by hand with `/feature` or `/bug`.

`gh` must be authenticated: `gh auth status`.
