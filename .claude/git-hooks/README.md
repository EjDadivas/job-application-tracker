---
tags: [library, templates, git, hooks]
---

# Git hooks template

Reusable client-side git hooks for Two Tabs projects. Currently: **`commit-msg`** — enforces our
semantic / Conventional Commit format (`<type>(<scope>): <subject>`).

This is the enforcement half of the commit convention; the teaching half is the **`git-commit` skill**
(`.claude/skills/git-commit/`) that gets Claude to write compliant messages in the first place. Full rationale
and the format reference live on the **Git & semantic commit messages** wiki page.

> Git hooks are **not** committed into a repo's history and are **not** shared automatically — each clone
> needs them installed once. Pick one of the paths below per project.

## What `commit-msg` does

- Validates the first real line of the commit message against
  `^(feat|fix|docs|style|refactor|test|chore)(\(scope\))?: subject`.
- Lets git's own machine-generated messages through (`Merge …`, `Revert …`, `fixup! …`, `squash! …`).
- On failure: prints the expected format + an example and **exits non-zero**, so the commit is rejected.
- Pure POSIX `sh`, no dependencies.

## Install — plain git

From the project root:

```sh
cp .claude/git-hooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

(Adjust the source path if this template lives elsewhere in the consuming project. The CLI scaffolder can do
this step automatically when seeding a new repo.)

## Install — Husky

If the project already uses [Husky](https://typicode.github.io/husky/) (so the hook is versioned and installs
on `npm install`):

```sh
# once, if Husky isn't set up yet:
npx husky init

# create the hook that calls this script (kept in the repo, e.g. at scripts/commit-msg.sh):
printf '%s\n' 'sh "$(git rev-parse --show-toplevel)/scripts/commit-msg.sh" "$1"' > .husky/commit-msg
```

Copy `commit-msg` into the repo (e.g. `scripts/commit-msg.sh`, `chmod +x`) so it's versioned, and have
`.husky/commit-msg` invoke it as above. Husky passes the commit-message file path as `$1`.

## Verify it works

```sh
# should be rejected (exit 1):
echo "fixed the thing" | .git/hooks/commit-msg /dev/stdin

# should pass (exit 0):
echo "fix(auth): handle expired session" | .git/hooks/commit-msg /dev/stdin
```
