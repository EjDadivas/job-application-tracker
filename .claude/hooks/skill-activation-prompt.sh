#!/bin/bash
# UserPromptSubmit → skill-activation-prompt.ts. tsx is a root devDependency.
# On a clone that has never been installed, say so once per prompt and exit 0
# instead of failing on every prompt until someone runs an install.
: "${CLAUDE_PROJECT_DIR:?CLAUDE_PROJECT_DIR is not set}"
cd "$CLAUDE_PROJECT_DIR"
if [ ! -x node_modules/.bin/tsx ]; then
  echo "[devkit] dependencies are not installed, so the devkit hooks are off. Run /setup-project; it installs and configures the repo."
  exit 0
fi
exec npx --no-install tsx .claude/hooks/skill-activation-prompt.ts
