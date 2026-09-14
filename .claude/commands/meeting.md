---
description: Extract structured notes from a Zoom transcript and save to vault/project/meetings/
argument-hint: "<path/to/transcript.txt> [-- topic-slug]"
model: sonnet
---

Process a meeting/Zoom transcript into a structured vault note. If `docs` is `off` in
`.claude/project-config.json`, say so and stop; this project does not keep meeting notes.

The file you write is read by people. Apply the `unslop` skill's self-audit to the prose before writing it.
## Step 1 — Resolve input

Parse `$ARGUMENTS`:
- First token is the transcript file path (required). It will usually be a `.txt`, `.vtt`, or `.md` from Zoom.
- Optional `-- <slug>` suffix overrides the auto-derived topic slug (kebab-case).

If no path is provided, ask the user where the transcript file is. Do NOT proceed without a real file.

Read the full transcript file. If it's a `.vtt` (WebVTT), strip the timestamp/cue-id lines and keep only the spoken text with speaker labels.

## Step 2 — Detect metadata

From the transcript content (and filename as a fallback), infer:
- **Date** — look for an explicit date in the first ~20 lines, the filename, or a "Recording started" marker. If none, fall back to today's date and note "(date inferred)".
- **Attendees** — collect every distinct speaker label.
- **Meeting purpose / type** — first 1–3 minutes of dialogue usually state it ("today we're going over…", "the goal of this call…").
- **Likely client / company name** — proper nouns repeated across attendee turns; "[Client: <name>]" if confident, omit if not.

## Step 3 — Extract (the prompt)

Read the transcript carefully end-to-end before writing anything. Treat it as primary source material — quote attribution must match the speaker label exactly. Then extract into the sections below. **If a section has nothing, write `_None._` — do not invent content to fill it.**

Extraction rules:
- **Decisions vs discussion** — only list a decision if a participant clearly committed ("we'll go with X", "let's do Y", "agreed"). Mere discussion is not a decision.
- **Action items** — every action item needs an owner (a named attendee, not "the team"). If no owner was named, list it under _Open questions_ instead with a note that ownership is unassigned.
- **Due dates** — capture only if stated. Convert relative dates ("by next Friday") into absolute dates using today as the anchor — today is referenced in `currentDate` of the project context. If ambiguous, keep the relative phrase verbatim.
- **Client asks / requirements** — anything the client requested, even informally ("would be nice if…"). Distinguish must-haves from nice-to-haves when the speaker signaled it.
- **Concerns / risks** — explicit worries, blockers, or pushback. Attribute the speaker.
- **Open questions** — anything raised but unresolved, or where the team said "let me get back to you".
- **Notable quotes** — 1–5 short, specific quotes that capture intent, scope, or strong opinions. Format: `> "quote" — Speaker`. Skip filler.
- **Glossary / new terms** — any project-specific term, internal tool, or acronym used as if known. Helps future readers.

Anti-patterns to avoid:
- Don't summarize what wasn't said. If the meeting didn't cover timelines, don't write "timeline TBD".
- Don't merge two speakers' positions into one bullet — attribute distinctly.
- Don't smooth over disagreement. If two attendees disagreed, both views go in.
- Don't paraphrase to the point of losing specifics — keep numbers, names, dates, and product/feature names verbatim.

## Step 4 — Pick target folder

Each meeting gets its own folder containing the analysis and the transcript as separate files.

Parent directory: `vault/project/meetings/` (create if missing).

Folder name: `YYYY-MM-DD-<topic-slug>/`
- Date from Step 2.
- Topic slug: kebab-case, ≤ 50 chars. Use the `--` override if provided; otherwise derive from the meeting purpose (e.g. "onboarding kickoff" → `onboarding-kickoff`).
- If a folder with that exact name already exists, append `-2`, `-3`, etc. — do not overwrite.

Files inside the folder:
- `analysis.md` — the structured extraction (Step 5).
- `transcript.<ext>` — the **original** transcript file moved into the folder, with its extension preserved (`.vtt`, `.txt`, `.md`). Always rename the basename to `transcript`. If multiple transcript-like files exist for the same meeting (e.g. Zoom + manual notes), suffix the others: `transcript-notes.md`, etc.

## Step 5 — Move the transcript and write `analysis.md`

1. **Move** the input transcript file into the new folder, renaming it to `transcript.<original-ext>`. Use `mv`, not copy — we don't want stale duplicates floating around the repo.
2. Do **not** rewrite, clean, or transform the transcript. Preserving the raw source as-is keeps it diff-able and trustworthy as the source of truth.
3. Write `analysis.md` next to it.

   **Copy `.claude/templates/meeting-analysis.md`. Do not compose its shape from memory.**

   Take everything below the marker line — starting with its `---` frontmatter fence — and fill the angle-bracket slots. If it is missing,
   say so and stop.

   The frontmatter must be exact — `---`, the keys, `---`, both fences — and **the file you write
   contains no code fences at all**, including around a bullet that wraps to a second line.

## Step 6 — Cross-link

Grep `vault/project/meetings/*/analysis.md` for prior meetings mentioning the same client or topic. If matches exist, add a `## See also` section to `analysis.md` (just above `## Source`) with `[[wikilinks]]` of the form `[[YYYY-MM-DD-topic-slug/analysis|Meeting Title]]`.

If this meeting touches an in-progress task (`vault/project/in-progress/<name>/issue.md`, folder named `<ID>-<slug>`) — match by topic, feature name, or explicit Linear ID mention in the transcript — link both ways: add the meeting to the issue's `## Notes`, and link the issue from the meeting's `## See also`.

## Step 7 — Confirm

Output:
- The created folder path and both files inside it (`analysis.md` and `transcript.<ext>`).
- The detected date, attendees, and a one-line summary.
- Any sections that came back `_None._` (so the user knows what's missing — they may want to add context the transcript didn't capture).
