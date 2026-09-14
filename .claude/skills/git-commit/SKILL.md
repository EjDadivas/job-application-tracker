---
name: git-commit
description: Write semantic / Conventional Commit messages. Use whenever staging and committing changes, writing or rewording a commit message, or preparing a PR title. Covers the type(scope) subject format, the seven allowed types, body/footer conventions, and the house co-author trailer.
---

# git-commit

Two Tabs uses **semantic / Conventional Commits**. When committing, write the message in this format — do not
free-form it.

## Format

```
<type>(<scope>): <subject>
```

- `<scope>` is **optional** — a short noun for the area touched (`auth`, `billing`, `schema`).
- `<subject>` is **present tense** ("add", not "added"/"adds"), **no trailing period**, ≤ ~72 chars.

## Choose the type from the change

| Type | When the diff is… |
|---|---|
| `feat` | A new user-facing feature |
| `fix` | A user-facing bug fix |
| `docs` | Documentation only |
| `style` | Formatting / whitespace / semicolons — **no production code change** |
| `refactor` | Restructuring production code with no behavior change (e.g. rename) |
| `test` | Adding or refactoring tests — **no production code change** |
| `chore` | Build tasks, deps, tooling — **no production code change** |

If a commit spans several types, it's usually two commits. Pick the dominant one only when they're truly
inseparable.

## Body & footer

For non-trivial commits, add a blank line then a body explaining the **why** (the diff already shows the what).
Reference the Linear issue (`TT-####`) and cite convention IDs (`per B-05`) where relevant.

Always append the house co-author trailer on agent-authored commits:

```
feat(auth): add WorkOS sealed-session cookie

Seals the AuthKit session so the Convex provider can read it on first
paint. Closes TT-412. Cites B-05.

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Rules

1. **Never commit without a type prefix.** The `commit-msg` git hook
   (`.claude/git-hooks/commit-msg`) rejects messages that don't match
   `^(feat|fix|docs|style|refactor|test|chore)(\(scope\))?: subject`.
2. **Subject is present-tense, lowercase after the colon, no period.**
3. **Committing is an outward action** — confirm with the human before running `git commit` (and certainly
   before `git push`), per the write-MCP / human-gate norm.
4. PR titles use the **same format** — on squash-merge the PR title becomes the commit.

Full handbook page: **Git & semantic commit messages** (project wiki). References:
<https://www.conventionalcommits.org/>, <https://seesparkbox.com/foundry/semantic_commit_messages>.

## Related

- `.claude/skills/unslop/SKILL.md` — how the body reads; run its self-audit on any body longer than one line
