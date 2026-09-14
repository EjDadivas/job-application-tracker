---
tags: [convex, migrations, schema, official-guidelines]
related-skill: convex
source: devkit/raw/convex/skills/convex-migration-helper
aliases: ["Migration Workflow"]
---

# Migration Workflow

> **Quick Summary**: Convex rejects a deploy if the schema doesn't match data at rest. Every breaking change follows a **widen → migrate → narrow** pattern across two deploys. Use `@convex-dev/migrations` for anything non-trivial.

## Why Migrations Are Needed

Convex schema validation is enforced at deploy time:
- Cannot add a required field if existing documents don't have it
- Cannot change a field type if existing documents have the old type
- Cannot remove a field if existing documents still have it

## Safe Changes (No Migration Needed)

- Adding an `v.optional(...)` field
- Adding a new table
- Adding an index

## The Widen-Migrate-Narrow Pattern

**Deploy 1 — Widen the schema:**
1. Update schema to allow both old and new formats (add optional new field)
2. Update reads to handle both formats
3. Update writes to use the new format for new documents
4. Deploy

**Between deploys — Migrate data:**
5. Run migration to backfill existing documents
6. Verify all documents migrated

**Deploy 2 — Narrow the schema:**
7. Update schema to require only the new format
8. Remove code handling the old format
9. Deploy

## Common Pitfalls

1. **Making a field required before migrating data** — Convex rejects the deploy. Always widen first.
2. **`.collect()` on large tables** — hits transaction limits. Use the migrations component.
3. **Not writing the new format before migrating** — documents created during the window will be missed.
4. **Skipping dry run** — always use `dryRun: true` to validate before touching production data.
5. **Deleting fields prematurely** — prefer `v.optional` + a comment until you're certain nothing references the field.
6. **Using crons for migration batches** — the migrations component handles batching internally. Crons need manual cleanup.

## Small Table Shortcut

For tables with only a few thousand documents, a single `internalMutation` is enough — no component needed:

```typescript
export const backfillSmallTable = internalMutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("smallConfig").collect();
    for (const doc of docs) {
      if (doc.newField === undefined) {
        await ctx.db.patch(doc._id, { newField: "default" });
      }
    }
  },
});
```

```bash
npx convex run migrations:backfillSmallTable
```

Only use `.collect()` when you are certain the table is small.

## See Also

- [[migrations-component]] — @convex-dev/migrations setup and usage
- [[migration-patterns]] — specific patterns: add/delete/change field, table split, zero-downtime
