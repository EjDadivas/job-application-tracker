---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## House notes

Questions are read by a person: apply the `unslop` skill's self-audit to them. One question, one sentence where it can be, no menu of candidate answers inside the question body.

Before dispatching a sub-agent for a fact, these usually answer it faster: `vault/_conventions.md` (rule IDs; cite them, never restate them), `vault/_index.md` (the map), `vault/_glossary.md` (check before inventing a word for something already named), `vault/project/SPEC.md` and `vault/project/features/<name>.md` (what is already settled or built).

When a round settles what a word _means_, that is a glossary entry, not just an answer; when it settles a decision that is hard to reverse, that is an ADR. Invoke the `domain-language` skill and record it as it happens. Batching these to the end of the session is how they get lost.

Motivation is the one question the repo can never settle: scope, data shape and seams can be read off existing code; a reason cannot. Ask the person, and give no recommended answer for it. Other projects in the conversation (a service account listing, other repos, other tickets) are not evidence about this one; do not cite them.
