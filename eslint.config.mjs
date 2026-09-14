import { defineConfig, globalIgnores } from 'eslint/config';
import { tanstackConfig } from '@tanstack/eslint-config';
import convexPlugin from '@convex-dev/eslint-plugin';

export default defineConfig([
  ...tanstackConfig,
  ...convexPlugin.configs.recommended,
  // Lint the app; the devkit tooling bundle and knowledge base aren't app code.
  // src/components/ui is vendored shadcn registry output — `shadcn add` rewrites
  // it verbatim, so house style rules there would fail CI on every new component.
  // Still typechecked by tsc and still formatted by Prettier.
  globalIgnores(['convex/_generated', '.claude/**', 'vault/**', 'src/components/ui/**']),
]);
