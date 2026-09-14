#!/bin/bash
# PreToolUse (Edit | MultiEdit | Write) → test-guard.ts.
# Fast path: only edits to *.test.* / *.spec.* files, and only while a TDD lock
# exists, need Node at all. Everything else exits here in a few milliseconds.
# Without an install there is no tsx; the edit is allowed rather than blocked.
set -e
: "${CLAUDE_PROJECT_DIR:?CLAUDE_PROJECT_DIR is not set}"
input="$(cat)"
[ -f "$CLAUDE_PROJECT_DIR/.claude/state/tdd-lock.json" ] || exit 0
printf '%s' "$input" | grep -q '\.\(test\|spec\)\.tsx\?' || exit 0
[ -x "$CLAUDE_PROJECT_DIR/node_modules/.bin/tsx" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
printf '%s' "$input" | exec npx --no-install tsx .claude/hooks/test-guard.ts
