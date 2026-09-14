---
tags:
  - convex
  - best-practices
  - philosophy
  - official-guidelines
source: https://docs.convex.dev/understanding/zen
aliases: ["Zen of Convex"]
---

# Zen of Convex

> **Quick Summary**: Queries are the default. Actions are a workflow, not a background job. Record progress one step at a time.

## Rules

- **Queries first.** Use a query for nearly every read — they're reactive, cached, consistent, resilient. Default over `useEffect` + fetch.
- **Keep sync-engine functions light.** Fewer than a few hundred records, under ~100ms. Slow transactions kill UI responsiveness.
- **Actions sparingly.** Only for external I/O or Node-only code. Slower, more expensive, fewer guarantees.
- **Never invoke actions directly from the browser.** Write a mutation that persists a dependent record and schedules the action. Queries can then observe progress.
- **Workflow, not background jobs.** The pattern is `action → mutation → more action → mutation`, with each step recording its result.
- **Record progress one step at a time.** Smaller batches make debugging, resume, and UI progress possible; one action handling thousands of records is brittle.
- **Don't re-cache on the client.** Convex's client already caches and syncs. Bind components directly to queries.
- **Don't drive UI from mutation return values.** Let the query + sync engine update the UI.

## See Also

- [[function-budget]] — hard per-transaction limits
- [[subscription-cost]] — keeping functions lean
- [[Public vs Internal Functions]] — scheduling always targets internal
