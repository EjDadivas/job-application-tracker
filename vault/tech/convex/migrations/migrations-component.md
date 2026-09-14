---
tags: [convex, migrations, schema, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-migration-helper/references/migrations-component
---

# @convex-dev/migrations

> **Quick Summary**: The `@convex-dev/migrations` component handles batching, cursor pagination, state tracking, resume from failure, and dry runs. Use it for any non-trivial data migration.

Official docs: https://www.convex.dev/components/migrations

## Install and Setup

```bash
npm install @convex-dev/migrations
```

```ts
// convex/convex.config.ts
import migrations from "@convex-dev/migrations/convex.config.js";
const app = defineApp();
app.use(migrations);
```

```ts
// convex/migrations.ts
import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();
```

## Define a Migration

`migrateOne` processes one document; the component handles batching automatically.

```ts
export const addDefaultRole = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    if (user.role === undefined) {
      await ctx.db.patch(user._id, { role: "user" });
    }
  },
});

// Shorthand: return object → applied as patch
export const clearDeprecatedField = migrations.define({
  table: "users",
  migrateOne: () => ({ legacyField: undefined }),
});
```

## Run a Migration

```bash
# Add a specific runner
export const runIt = migrations.runner(internal.migrations.addDefaultRole);
npx convex run migrations:runIt

# Or use the general runner
npx convex run migrations:run '{"fn": "migrations:addDefaultRole"}'
```

## Run Multiple in Order

```ts
export const runAll = migrations.runner([
  internal.migrations.addDefaultRole,
  internal.migrations.clearDeprecatedField,
]);
```

If one fails, it stops. Call again to resume from where it left off. Completed migrations are skipped.

## Dry Run (Always Use First)

```bash
npx convex run migrations:runIt '{"dryRun": true}'
```

Runs one batch and rolls back — see what it would do without changing data.

## Monitor Status

```bash
npx convex run --component migrations lib:getStatus --watch
```

## Cancel

```bash
npx convex run --component migrations lib:cancel '{"name": "migrations:addDefaultRole"}'
```

## Configuration Options

```ts
// Reduce batch size for large documents or heavy write traffic
migrations.define({
  table: "largeDocuments",
  batchSize: 10,
  migrateOne: async (ctx, doc) => { /* ... */ },
});

// Migrate a subset via index
migrations.define({
  table: "users",
  customRange: (query) => query.withIndex("by_name", (q) => q.eq("name", "")),
  migrateOne: () => ({ name: "<unknown>" }),
});

// Parallelize within a batch (only when order doesn't matter)
migrations.define({
  table: "myTable",
  parallelize: true,
  migrateOne: () => ({ optionalField: undefined }),
});
```

## Run on Deploy

```bash
npx convex deploy --cmd 'npm run build' && npx convex run migrations:runAll --prod
```

## See Also

- [[migration-workflow]] — widen-migrate-narrow pattern and when to use this component
- [[migration-patterns]] — specific patterns with code examples
