# Issue tracker: Linear

Copy into the `## Issue tracker` section of `.claude/project-config.md`, filling in the team key.

---

**Linear** — team `<KEY>`, via the Linear MCP.

- **Create** — `save_issue` with `team`, `title`, `description`. It returns the identifier
  (`<KEY>-123`).
- **Fetch** — `get_issue` by identifier; `list_issues` filtered by `assignee`, `state` or `cycle`.
- **Sub-issues** — `save_issue` on the child with the parent's id set as its parent.
- **Blocked by** — Linear relations, not prose. Set the `blocks` / `blocked by` relation on the
  issue.
- **Mirror** — `/linear <ID>` fetches the issue with its relations and asks where to write it:
  `vault/local/linear/` (gitignored draft) or
  `vault/project/in-progress/<parent-or-self>-<slug>/` (committed). The Linear issue stays the
  source of truth for state; the vault doc is the plan.

Branch names follow `<user>/<KEY>-123-<slug>`, which is what `/setup-project` detects on a re-run.
