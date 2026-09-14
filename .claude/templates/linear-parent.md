Seed template for `/linear — parent issue doc`. Everything below the marker line is the literal file body,
starting with its `---` frontmatter fence.

Copy it, fill the angle-bracket slots, and delete this header. **Do not wrap any part of it in a
code fence** — the output file contains no fences at all. A line too long to fit continues as a
plain indented line.

Preserve any existing content under `## Notes` when updating a file that already exists.

=== TEMPLATE BEGINS ON THE NEXT LINE ===
---
title: <issue title>
linear-id: <ISSUE-ID>
status: <status>
updated: YYYY-MM-DD
role: parent
---

# 📌 PARENT ISSUE — <ISSUE-ID>

> This is the umbrella issue. Sub-issues live as sibling files in this folder.

## Summary
<1-2 sentence description from the issue>

## Acceptance Criteria
<bullet list from the issue description, or "Not specified">

## Context
**Branch:** <branch>
**Priority:** <priority>
**Assignee:** <assignee>

## Sub-Issues (in this folder)
- [[<sub-issue-filename-without-ext>]] — <one-line purpose>

## Notes
<!-- Add implementation notes here -->
