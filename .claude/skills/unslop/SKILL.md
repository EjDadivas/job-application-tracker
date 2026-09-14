---
name: unslop
description: Cut AI tells from prose a human will read — PR descriptions, commit bodies, Linear updates, READMEs, vault notes. Use before publishing any generated text, or when the user says unslop, de-slop, tighten this, or that it reads like AI.
---

# Unslop

Cut the tells from prose a **human** will read. PR descriptions, commit bodies, Linear comments,
READMEs, vault notes, release notes.

Not for prose an **agent** reads — that is `writing-for-agents`, and it wants different things.

**This is a style filter, not a truth filter.** It makes bad writing read like a person wrote it.
It does not make it correct. `/review` and `/grill` are what make it correct.

## The process

1. Scan for the patterns below.
2. Rewrite. Preserve meaning, match the intended tone.
3. Add soul.
4. **Self-audit: "what makes this obviously AI-generated?" Fix what is left.**

Step 4 is the one people skip, and it catches what a rule list cannot.

## Start with these three

They fire on almost every generated PR description. If you do nothing else, do these.

**1. Say what it does, not how it feels.** *(the best rule here)*

"The database stays close at hand", "SQL you can read", "types that follow your schema" all name a
*feeling*. Name the mechanism or the number instead: "`.toSQL()` returns the exact string sent to
the database", "a column rename fails the build".

Ask what the sentence tells the reader to **do or know**, then write that. Two checks:

- If you cannot restate it as a concrete instruction, fact, or number — **cut it**.
- **If the sentence could appear unchanged in another project's docs, it says nothing about this
  one. Cut it.**

That second check alone kills the opening paragraph of most generated PR descriptions.

**2. Bold label plus colon that restates the line.**

❌ `**Performance:** Performance improved by...`
✅ `**Performance.** The member list query dropped from 340ms to 40ms after the index landed.`

The test: does the text after the label add anything the label did not already say?

**3. No em dashes.** Periods or commas. Parentheses instead just trade one tell for another. Watch
the two that slip through: a bullet joining a filename to its description, and a bold header joined
to its text.

## Adding soul

Removing patterns is half the job. **Sterile, voiceless writing is just as obvious as slop.**

- **Have opinions.** React to the facts rather than listing pros and cons neutrally.
- **Vary rhythm.** Short sentences. Then longer ones that take their time.
- **Acknowledge complexity.** "Impressive but also kind of unsettling" beats "impressive".
- **Use "I" when it fits.** First person is not unprofessional.
- **Let some mess in.** Perfect structure looks machine-made.
- **Be specific.** Not "this is concerning" but "there is something unsettling about agents
  churning away at 3am".

## The full checklist

### Content

| Tell | Fix |
|---|---|
| Puffery: "pivotal moment", "testament to", "evolving landscape", "indelible mark" | Cut it. State what happened. |
| Superficial `-ing` phrases: "highlighting...", "ensuring...", "showcasing...", "fostering..." | Delete, or expand with a real source. |
| Promotional language: "groundbreaking", "renowned", "seamless", "robust", "powerful" | Neutral description. |
| Vague attribution: "experts believe", "reports suggest" | Name the source or delete. |
| Formulaic challenge: "Despite challenges, X continues to thrive." | Specific facts. |

### Language

| Tell | Fix |
|---|---|
| AI vocabulary: additionally, crucial, delve, enhance, fostering, garner, interplay, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant | Plain words. |
| Fancy ways to say "is": "serves as", "stands as", "boasts", "features" | "is" or "has". |
| "Not just X, but Y." | State the point. |
| Rule of three: forcing ideas into groups of three | Use the natural number. |
| Synonym cycling: query, request, call, lookup in one paragraph | Pick one, repeat it. |
| False ranges: "from X to Y" where they are not on a scale | List the things. |

### Style

| Tell | Fix |
|---|---|
| Em dashes | Banned. Periods or commas. |
| Colons mid-sentence as a connector | Fine before a list or example, not as glue. |
| Bolding every proper noun and acronym | Bold for emphasis only. |
| Inline-header lists that restate the label | See rule 2 above. |
| Title Case Headings | Sentence case. |
| Decorative emoji in headings and bullets | Remove. (Status markers like ✅ ❌ in a results table are fine.) |
| Curly quotes | Straight quotes. |

### Chat residue

| Tell | Fix |
|---|---|
| "I hope this helps!", "Let me know if...", "Certainly!" | Remove. |
| "While specific details are limited..." | Find the source or remove. |
| "Great question!", "You're absolutely right!" | Respond directly. |

### Filler

| Tell | Fix |
|---|---|
| "In order to" | "To" |
| "Due to the fact that" | "Because" |
| "It is important to note that" | Delete the phrase, keep the note. |
| "could potentially possibly be argued that it might" | "may" |
| Generic conclusion: "The future looks bright." | A specific plan or fact, or nothing. |

### Abstract metaphor nouns

The rule that catches the most **engineering** writing. These read as technical but almost always
have a plainer concrete word:

> substrate, wedge, vector, locus, vantage, nexus, primitive (as a noun), harness (as a metaphor),
> surface (as in "API surface"), bedrock, scaffolding (as a metaphor), modality, paradigm,
> gold-plating, ratchet, evacuate (for moving code), endgame, north star, flywheel

"Substrate" → "base". "Wedge in" → "add". "Vector" → "way". "Gold-plating" → "more than the job
needs". "Evacuate" → "move out". "Endgame" → "the last phase". **Pick the concrete word.**

### Plain speech

- **Split dense sentences.** If the reader backtracks to parse it, break it in two. One idea per
  sentence.
- **Active voice.** Catch "is/are/was/were + past participle" and name the actor. "Queries are
  validated" → "the compiler validates queries". Passive only when the actor is genuinely unknown.
- **Cut adverbs, or use a stronger verb.** "Runs quickly" → "is fast", or the number.
  "Significantly improves" → the measured delta. An adverb propping up a weak verb means the verb
  is wrong.
- **Prefer the plain word.** utilize → use. leverage → use. facilitate → help. numerous → many.
  in the event that → if.

## Related

- `.claude/skills/writing-for-agents/SKILL.md` — the opposite audience
- `.claude/skills/git-commit/SKILL.md` — commit format; this skill covers how the body reads
- `/review` — correctness. This skill only handles style
