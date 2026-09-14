---
description: Fetch Linear issue context from the current branch and save it to vault/local/linear/ (tentative) or vault/project/in-progress/<ID>-<slug>/issue.md (team-visible)
argument-hint: "[ISSUE-ID] — auto-detected from branch if omitted"
model: haiku
---

## Step 1 — Resolve the issue ID

The file you write is read by people. Apply the `unslop` skill's self-audit to the prose before writing it.
Use `$ARGUMENTS` if it contains `[A-Za-z]+-\d+`. Otherwise parse `git rev-parse --abbrev-ref HEAD`:
branch convention is `username/IDENTIFIER-title`, so look in the segment after the first `/`. If
nothing is found, ask. Normalize to uppercase.

## Step 2 — Fetch from Linear

Call the Linear MCP tool for the issue **with `includeRelations: true`**. Extract title,
description, status, assignee, priority, labels, parent, estimate, due date. If there is a parent,
fetch its details in the same call; the parent's slug names the folder.

## Step 3 — Ask where the doc lives

`AskUserQuestion`:

> **L — Local working notes** — `vault/local/linear/<ISSUE-ID>-<slug>.md` (gitignored; default for tentative work)
> **P — Project in-progress** — `vault/project/in-progress/<name>/` (committed; pick when the plan is firm enough to share)

Skip the question only if a doc for this ID already exists under either location; write back there
and preserve `## Notes`.

## Step 4 — Names

**Slugs are mandatory.** kebab-case, 2–5 words from the issue title, lowercase, Step-N prefixes
stripped (`Step 0 — Copy retry utilities` → `copy-retry-utilities`).

Under P, the task folder is the unit everything else uses (`/handoff-to-agent` writes `plan.md` and
`tasks.md` beside it; `/dev` moves the whole folder to `done/`):

```
vault/project/in-progress/
└── TT-3586-airtable-webhook-sync/        ← <PARENT-OR-SELF-ID>-<slug>
    ├── issue.md                          ← the issue this folder is about (parent, or standalone)
    ├── TT-3635-copy-retry-utilities.md   ← sub-issues, if any
    └── TT-3639-webhook-drain-cron.md
```

A standalone issue gets its own folder with just `issue.md`.

## Step 5 — Write

Create the folder if needed. If the file exists, update it and preserve `## Notes`.

- Parent or standalone → copy `.claude/templates/linear-parent.md` below its marker line.
- Sub-issue → copy `.claude/templates/linear-sub.md` below its marker line.

Exact frontmatter fences; no code fences anywhere in the file you write.

## Step 6 — Confirm and route

Print the path and title. Then: feature → `/feature <summary>`, bug → `/bug <summary>`. Each runs its
own gate and, on hand-off, writes the plan into this same folder.
