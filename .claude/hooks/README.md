# Hooks

Two hooks, both registered in `.claude/settings.json`. They run through `npx --no-install tsx`;
`tsx` is a root devDependency, so the project's normal install is the only setup. A missing install fails loudly
on the first prompt instead of fetching from npm.

## `skill-activation-prompt` — UserPromptSubmit

Reads the prompt, matches whole-word keywords and intent regexes from
`.claude/skills/skill-rules.json`, classifies intent (FEATURE / BUG / QUESTION), and prints a short
`[devkit]` directive. The pre-implementation rules block prints once per session (tracked by
`.claude/state/<session>/rules-shown`); later turns get a one-line reminder. Prompts that start
with `/feature`, `/bug` or `/ask` get no directive, because the command body carries it.

Reads `.claude/project-config.json` for `tdd`, `autonomy`, `docs`, `worktrees`. When the file is
missing it says so on every prompt and assumes `ask / guided / full / off`. `/setup-project`
writes the file; `/config` edits it.

Writes `.claude/state/<session>/intent-state.json` (advisory; nothing else reads it today).

## `test-guard` — PreToolUse (Edit | MultiEdit | Write)

Denies edits to locked test files while `.claude/state/tdd-lock.json` exists with
`mode: "implementing"`. `/generate-tests` writes the lock; `/tdd-reset` removes it. The shell
wrapper exits before starting Node unless the lock exists and the edit targets a `*.test.*` or
`*.spec.*` file, so a normal edit costs a few milliseconds.

## What was removed, and why

`auto-test-runner` (PostToolUse), `feature-doc-drift` and `test-reminder` (Stop) printed plain
text on exit 0, which Claude Code shows in the debug log but never injects into the conversation.
They cost ~1 s of Node startup per edit and per turn for output nobody read. Their jobs moved to
places that do reach Claude: `/dev` dispatches `qa-tester` and `/feature-sync` after a hand-off,
and `dev-agent` runs its own tests.

## State

```
.claude/state/                  # gitignored
  tdd-lock.json                 # project-wide TDD lock (mode, lockedTests, activatedAt)
  <session_id>/
    intent-state.json           # last classified intent
    rules-shown                 # rules block already printed this session
```
