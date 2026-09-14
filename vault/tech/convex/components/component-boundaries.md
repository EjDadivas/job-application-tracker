---
tags: [convex, components, architecture, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-create-component
---

# Component Boundaries

> **Quick Summary**: Components cannot access `ctx.auth`, `process.env`, or the app's table namespace. Keep auth, env vars, and HTTP routes in the app. Pass auth-resolved values and parent IDs as strings across the boundary.

## Critical Rules

### Auth and Env Stay in the App

```ts
// Bad: component code cannot rely on app auth or env
const identity = await ctx.auth.getUserIdentity();
const apiKey = process.env.OPENAI_API_KEY;

// Good: app resolves auth and env, passes explicit values
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Not authenticated");

await ctx.runAction(components.translator.translate, {
  userId,
  apiKey: process.env.OPENAI_API_KEY,
  text: args.text,
});
```

### IDs Cross the Boundary as Strings

```ts
// Bad: v.id("users") is invalid inside a component — it doesn't know the app's tables
args: { userId: v.id("users") }

// Good: treat parent-owned IDs as strings at the boundary
args: { userId: v.string() }
```

### No Direct Client Access to Component Functions

```ts
// Bad: component functions are internal, not client-callable
export const send = components.notifications.send;

// Good: re-export through an app mutation
export const sendNotification = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.runMutation(components.notifications.lib.send, { userId, message: args.message });
  },
});
```

### HTTP Routes Mount in the App

Components cannot register their own HTTP routes. If the component defines HTTP handlers, mount them in the app's `convex/http.ts`.

### Pagination in Components

Built-in `.paginate()` does not work across the component boundary. Use `paginator` from `convex-helpers` instead.

### Use Component's Own Generated Files

```ts
// Bad: imports from app's generated files
import { mutation } from "../../_generated/server";

// Good: imports from component's own generated files
import { mutation } from "./_generated/server.js";
```

## Advanced Patterns

### Function Handles for Callbacks

When the app needs to pass a callback to the component:

```ts
// App side
import { createFunctionHandle } from "convex/server";

export const startJob = mutation({
  handler: async (ctx) => {
    const handle = await createFunctionHandle(internal.myModule.processItem);
    await ctx.runMutation(components.workpool.enqueue, { callback: handle });
  },
});
```

```ts
// Component side
export const enqueue = mutation({
  args: { callback: v.string() },
  handler: async (ctx, args) => {
    const handle = args.callback as FunctionHandle<"mutation">;
    await ctx.scheduler.runAfter(0, handle, {});
  },
});
```

### Derive Validators from Schema

```ts
import schema from "./schema.js";

const notificationDoc = schema.tables.notifications.validator.extend({
  _id: v.id("notifications"),
  _creationTime: v.number(),
});
```

### Globals Table for Component Config

```ts
// schema.ts
globals: defineTable({ maxRetries: v.number(), webhookUrl: v.optional(v.string()) }),
```

```ts
// lib.ts
export const configure = mutation({
  args: { maxRetries: v.number(), webhookUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("globals").first();
    existing ? await ctx.db.patch(existing._id, args) : await ctx.db.insert("globals", args);
    return null;
  },
});
```

## See Also

- [[workpool]], [[workflow]], [[action-retrier]], [[crons]] — pre-built components in this folder
