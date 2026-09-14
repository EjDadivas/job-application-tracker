---
description: One-time repo setup — project config, dependencies, and the Convex/WorkOS/PostHog stack. Run once per repo before anything else.
argument-hint: '[verify | stack] — omit for a full setup; verify runs the 15 install health checks; stack redoes the services only'
---

Read `.claude/skills/setup-project/SKILL.md` and follow it exactly, start to finish.

Pass the argument through unchanged: `verify` → Part D only, `stack` → Part C only, no argument →
Parts A, B and C, stopping after Part C.

That file is the whole procedure. It carries its own seed templates in
`.claude/skills/setup-project/references/`, and the paths written as `references/…` inside it are
relative to that folder. **Read the seed file before writing any section it names** — the point of
those files is that a section gets copied rather than composed.

This command is a thin entry point only. Do not summarise the skill, restate its steps, or plan an
approach before reading it. Open it and begin.
