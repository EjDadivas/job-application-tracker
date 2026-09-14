---
tags: [backend, anti-patterns, index]
_verified: 2026-09-04
---

# Backend Anti-Patterns Index

Entry point for backend anti-patterns. Injected by `BUG_CONTEXT` in
`.claude/hooks/skill-activation-prompt.ts` and cited by `/bug` — start here, then open the
one area file that matches the symptom. Do not read all of them.

## Where to look

| Area | File | Open it when the symptom is |
|---|---|---|
| Convex | [[Convex Anti-Patterns]] (`vault/tech/convex/`) | Slow or unbounded queries, OCC conflicts, schema/validator errors, auth bypass, workflow or trigger misbehaviour, migration failures, failing `convex-test` runs |
| WorkOS | [[WorkOS Anti-Patterns]] (`vault/tech/workos/`) | Role or permission checks passing when they should fail, SSO redirect loops, Admin Portal link errors, webhook signature or replay problems |
| Resend | [[Resend Anti-Patterns]] (`vault/tech/resend/`) | Email not sending from an action, React Email render problems, webhook handler errors |

## Fastest first checks

Most backend bugs in this repo land on one of these rules — check them before reading further.

| Symptom | Suspect rule | Where |
|---|---|---|
| Full table scan, slow list query | **B-02** — `.withIndex`, never `.filter()` on a raw query | [[Convex Anti-Patterns]] → Query performance |
| Function callable by anyone | **B-05** — public functions open with `requireAuth`, then the ownership check | [[Convex Anti-Patterns]] → Auth & authorization |
| Wrong file path, function not found | **B-17** — `convex/features/<entity>/<purpose>[.public].ts` | [[Convex Anti-Patterns]] → Function structure |
| Runtime type error on args | **B-01** — every query/mutation/action declares `args:` | [[Convex Anti-Patterns]] → Function structure |
| Test asserts on a message and breaks on a copy edit | **B-12** — assert `err.data.code`, never `err.message` | [[Convex Anti-Patterns]] → Testing |
| Missing unauth / wrong-actor coverage | **B-11** — the three-test trio | [[Convex Anti-Patterns]] → Testing |

Full rule text: `vault/_conventions.md` (B-01…B-18). This index links; it does not restate the rules.

## Related

- [[Frontend Anti-Patterns Index]]
- [[_conventions|vault/_conventions]]
- [[_index|vault/_index]]
