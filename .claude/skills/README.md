# Skills

All skill content lives in the Obsidian vault at `vault/`, not in this folder.

Each subdirectory here contains **only a `SKILL.md` stub** — that stub is what the Claude Code skill system activates on (via YAML frontmatter `name`). The stub points into the vault so Claude navigates to the right notes without loading unused material.

- **Activation rules:** `skill-rules.json` — prompt keywords (whole-word) and intent regexes, read by `.claude/hooks/skill-activation-prompt.ts`
- **Vault map:** `vault/_index.md`
- **Numbered rules:** `vault/_conventions.md`

## Why one file per skill (not a single combined `SKILL.md`)

Each `SKILL.md` is a discrete skill with its own `name`, description, and activation triggers in `skill-rules.json`. The Claude Code harness keys off that 1:1 mapping — one activation → one stub. A combined file would either force every trigger to load the same content (defeating progressive disclosure) or require a new dispatch layer that duplicates what `skill-rules.json` already does.

The stubs themselves are short (10–25 lines each); the cost is minimal and the separation keeps activation targeted.
