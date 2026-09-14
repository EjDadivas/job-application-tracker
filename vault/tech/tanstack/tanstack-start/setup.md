---
tags: [frontend, tanstack, start, setup, config, convex]
related-skill: tanstack
aliases: ["TanStack Start Setup"]
---

# TanStack Start Setup

> **Quick Summary**: Scaffold via `npm create convex@latest -- -t tanstack-start` (includes Convex wiring) or manually install `@tanstack/react-start` + router plugin. Wire `ConvexQueryClient` into `router.tsx` and wrap the router in `ConvexProvider`. Use `useSuspenseQuery(convexQuery(...))` for SSR'd Convex data.

## Content

### Start vs plain Router — pick one

| Situation | Pick |
|---|---|
| Client-only SPA, existing backend | Plain TanStack Router |
| Need SSR or server functions | TanStack Start |
| Need file-based API routes | TanStack Start |
| Targeting a specific edge/serverless platform | TanStack Start (Nitro preset) |

Start is currently **RC** — stable for use; RSC is a forthcoming non-breaking v1.x addition.

### Fast path (with Convex)

```bash
npm create convex@latest -- -t tanstack-start
```

This scaffolds the app, `convex/` folder, and wires `ConvexQueryClient` into the router.

### Manual install

```bash
npx @tanstack/cli create my-app
# or
npm install @tanstack/react-start @tanstack/react-router react react-dom
npm install -D @tanstack/router-plugin typescript vite vite-tsconfig-paths
npm install convex @convex-dev/react-query @tanstack/react-router-ssr-query @tanstack/react-query
```

### Project structure

```
my-app/
  app/
    routes/
      __root.tsx          # Root layout
      index.tsx           # / route
      posts.$postId.tsx   # /posts/:postId
      api/
        users.ts          # /api/users API route
    client.tsx            # Client entry
    router.tsx            # Router + ConvexQueryClient wiring
    ssr.tsx               # SSR entry
    routeTree.gen.ts      # Auto-generated route tree
  convex/                 # Convex backend
  app.config.ts
```

### `app.config.ts`

```typescript
import { defineConfig } from '@tanstack/react-start/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  vite: {
    plugins: [viteTsConfigPaths({ projects: ['./tsconfig.json'] })],
  },
  server: {
    preset: 'node-server', // see [[TanStack Start Deployment]] for preset list
  },
  tsr: {
    appDirectory: './app',
    routesDirectory: './app/routes',
    generatedRouteTree: './app/routeTree.gen.ts',
  },
})
```

### `__root.tsx` — QueryClient in router context

```tsx
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, Scripts, HeadContent } from "@tanstack/react-router";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({ meta: [{ charSet: "utf-8" }, { title: "App" }] }),
  component: () => (
    <html>
      <head><HeadContent /></head>
      <body><Outlet /><Scripts /></body>
    </html>
  ),
});
```

### `router.tsx` — ConvexQueryClient + ConvexProvider

> **Auth note**: If using WorkOS AuthKit, replace `ConvexProvider` with `ConvexProviderWithAuth` and add the `useAuthFromWorkOS` adapter. See [[WorkOS AuthKit + Convex + TanStack Start Integration]].

```tsx
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL!;
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    context: { queryClient },
    scrollRestoration: true,
    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>
        {children}
      </ConvexProvider>
    ),
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
```

### Querying Convex from a route

```tsx
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data } = useSuspenseQuery(convexQuery(api.tasks.get, {}));
  return <div>{data.map(t => <div key={t._id}>{t.text}</div>)}</div>;
}
```

### Starting the backend

```bash
npx convex dev
```

Logs in (browser auth on first run), creates a project, generates `convex/_generated/`, and syncs on save. **Agents can't run this interactively** — ask the user to run it, or use `CONVEX_AGENT_MODE=anonymous npx convex dev` for headless contexts.

## Pitfalls

- Missing `declare module '@tanstack/react-router'` → loses all type safety
- Importing server-only code in client bundles → build errors
- Forgetting to regenerate `routeTree.gen.ts` after route file changes (usually handled by the dev server/plugin, but watch out in CI)
- Using `useQuery` instead of `useSuspenseQuery` for data that should be server-rendered → ships HTML without the content

## Related Notes

- [[TanStack Start Deployment]] — preset values for `server.preset`
- [[Convex + TanStack Start — SSR & Loaders]] — `ensureQueryData`, `loaderDeps`
- [[Convex React Query Adapter]] — `convexQuery`, `useConvexMutation`
- [[Router Type Safety]] — `declare module` pattern
