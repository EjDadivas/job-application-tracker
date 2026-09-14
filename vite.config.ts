import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import * as dotenv from 'dotenv';

// Load .env.local (TanStack Start/Vite convention)
dotenv.config({ path: '.env.local', quiet: true });
// Also load .env as fallback
dotenv.config({ quiet: true });

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    // Tailwind v4 via its Vite plugin (the officially recommended integration for
    // Vite). The PostCSS plugin can't resolve `@import "tailwindcss"` here —
    // Vite's postcss-import treats the bare specifier as a relative path.
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});
