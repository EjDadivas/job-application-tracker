---
tags: [project, feature]
feature: <name>
status: active
_verified: <YYYY-MM-DD>
---

# <Feature name>

> Skeleton for a feature doc. Copy this file to `vault/project/features/<name>.md`, fill every
> section, and add a row to [[project/features/_index|vault/project/features/_index]]. Keep the section order
> below — `/feature-sync` relies on it.
>
> **No file inventories.** Name functions and behaviour, not paths — paths go stale, names
> survive refactors. See [[project/features/README|vault/project/features/README]].

## Purpose

One or two sentences. What this feature does and who it is for. Written from the user's
perspective, not the implementation's.

## User flow

The path a user takes through the feature, as ordered steps. Name the surface (the route, the
dialog, the settings panel), not the component file.

1. …
2. …
3. …

## Public API

Exported Convex function names only — no file paths, no signatures.

| Function | Kind | Does |
|---|---|---|
| `listX` | query | … |
| `createX` | mutation | … |

## RBAC

Who can call what. Name the role or permission, and the helper that enforces it
(`requireAuth`, plus the ownership check) per **B-05**.

| Function | Who can call it | Enforced by |
|---|---|---|
| `listX` | any signed-in user | `requireAuth` |
| `createX` | owner only | `requireAuth` + ownership check |

## Conventions pointers

Rules that bind this feature, by ID — link, never restate. Full text in
[[_conventions|vault/_conventions]].

- **B-17** — feature folder layout
- **B-05** — auth boundary on public functions
- **B-11** — three-test trio (happy path, unauth, wrong actor)
- …

## Open questions

Decisions not yet made, and what would settle them. Delete the section when it is empty —
do not leave "None" behind.

- …

## Related

- [[project/features/_index|vault/project/features/_index]]
- [[_conventions|vault/_conventions]]
