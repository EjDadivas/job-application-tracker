---
tags: [convex, migrations, schema, patterns, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-migration-helper/references/migration-patterns
aliases: ["Migration Patterns"]
---

# Migration Patterns

> **Quick Summary**: Common migration recipes using `@convex-dev/migrations`. Always guard with `if (field === undefined)` to make migrations idempotent. Prefer dual write over dual read for safe rollback.

## Adding a Required Field

```typescript
// Deploy 1 — schema allows both states
users: defineTable({ name: v.string(), role: v.optional(v.union(v.literal("user"), v.literal("admin"))) });

// Migration — backfill
export const addDefaultRole = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    if (user.role === undefined) {
      await ctx.db.patch(user._id, { role: "user" });
    }
  },
});

// Deploy 2 — make required
users: defineTable({ name: v.string(), role: v.union(v.literal("user"), v.literal("admin")) });
```

## Deleting a Field

```typescript
// Deploy 1 — make optional
// isPro: v.boolean()  →  isPro: v.optional(v.boolean())

export const removeIsPro = migrations.define({
  table: "teams",
  migrateOne: async (ctx, team) => {
    if (team.isPro !== undefined) {
      await ctx.db.patch(team._id, { isPro: undefined });
    }
  },
});

// Deploy 2 — remove from schema entirely
```

## Changing a Field Type

Prefer a new field — combine add and delete in one migration:

```typescript
// Deploy 1: isPro: v.optional(v.boolean()), plan: v.optional(...)

export const convertToEnum = migrations.define({
  table: "teams",
  migrateOne: async (ctx, team) => {
    if (team.plan === undefined) {
      await ctx.db.patch(team._id, {
        plan: team.isPro ? "pro" : "basic",
        isPro: undefined,
      });
    }
  },
});

// Deploy 2: remove isPro, make plan required
```

## Splitting Nested Data Into a Separate Table

Make sure new documents already write to both tables before running the migration:

```typescript
export const extractPreferences = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    if (user.preferences === undefined) return;

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!existing) {
      await ctx.db.insert("userPreferences", { userId: user._id, ...user.preferences });
    }
    await ctx.db.patch(user._id, { preferences: undefined });
  },
});
```

## Zero-Downtime Strategies

### Dual Write (Preferred)

Write to both old and new structures. Read from old until migration completes.

1. Deploy: write both formats, read old format
2. Run migration on existing data
3. Deploy: read new format, still write both
4. Deploy: read and write only new format

Safe to roll back at any point because the old format stays current.

### Dual Read

Write only new format, read both (prefer new):

```typescript
function getTeamPlan(team: Doc<"teams">): "basic" | "pro" {
  if (team.plan !== undefined) return team.plan;
  return team.isPro ? "pro" : "basic";
}
```

Avoids duplicate writes but harder to roll back.

## Verify Migration Complete

```typescript
export const verifyMigration = query({
  handler: async (ctx) => {
    const remaining = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), undefined))
      .take(10);
    return { complete: remaining.length === 0, sampleRemaining: remaining.map((u) => u._id) };
  },
});
```

Or use the component's built-in status:

```bash
npx convex run --component migrations lib:getStatus --watch
```

## See Also

- [[migration-workflow]] — widen-migrate-narrow overview and pitfalls
- [[migrations-component]] — @convex-dev/migrations setup and commands
