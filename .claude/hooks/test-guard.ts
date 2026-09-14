#!/usr/bin/env node
// PreToolUse guard: while a TDD lock exists (.claude/state/tdd-lock.json, written
// by /generate-tests, removed by /tdd-reset), edits to the locked test files are
// denied so the implementation is made to pass the tests, not the other way round.
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface HookInput {
  tool_name: string;
  tool_input: { file_path?: string; edits?: Array<{ file_path: string }> };
}

interface TddLock {
  mode: 'implementing' | 'inactive';
  lockedTests: string[];
  activatedAt?: number;
}

function normalize(p: string): string {
  return p.replace(/\\/g, '/');
}

// A locked path is repo-relative; the tool passes an absolute path. Match when the
// absolute path ends with "/" + locked path, or the two are equal. No reverse match.
function isLocked(filePath: string, lock: TddLock): boolean {
  const file = normalize(filePath);
  return lock.lockedTests.some((locked) => {
    const l = normalize(locked).replace(/^\.\//, '');
    return file === l || file.endsWith('/' + l);
  });
}

function main(): void {
  const projectDir = process.env.CLAUDE_PROJECT_DIR;
  if (!projectDir) process.exit(0);

  const lockFile = join(projectDir, '.claude', 'state', 'tdd-lock.json');
  if (!existsSync(lockFile)) process.exit(0);

  let lock: TddLock;
  let data: HookInput;
  try {
    lock = JSON.parse(readFileSync(lockFile, 'utf-8')) as TddLock;
    data = JSON.parse(readFileSync(0, 'utf-8')) as HookInput;
  } catch (err) {
    console.error('test-guard: could not read lock or input, allowing edit:', err);
    process.exit(0);
  }
  if (lock.mode !== 'implementing' || !Array.isArray(lock.lockedTests)) process.exit(0);

  const paths =
    data.tool_name === 'MultiEdit' && data.tool_input.edits
      ? data.tool_input.edits.map((e) => e.file_path)
      : data.tool_input.file_path
        ? [data.tool_input.file_path]
        : [];
  const blocked = paths.filter((p) => isLocked(p, lock));
  if (blocked.length === 0) process.exit(0);

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `TDD lock active: ${blocked.join(', ')} is locked. Make the tests pass by changing the implementation, not the tests. Run /tdd-reset to unlock.`,
      },
    }),
  );
  process.exit(2);
}

main();
