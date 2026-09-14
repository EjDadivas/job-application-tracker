#!/usr/bin/env node
// UserPromptSubmit hook. Reads the prompt, matches skill triggers from
// .claude/skills/skill-rules.json, classifies intent (FEATURE / BUG / QUESTION),
// and prints a short directive. The full rules block prints once per session;
// later turns get a one-line reminder. Reads .claude/project-config.json for the
// workflow switches and says so loudly when it is missing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ── Config ───────────────────────────────────────────────────────────

type TddMode = 'auto' | 'ask' | 'disabled';
interface ProjectConfig {
  tdd: TddMode;
  autonomy: 'agent' | 'guided';
  docs: 'full' | 'off';
  worktrees: 'on' | 'off';
}
const DEFAULTS: ProjectConfig = { tdd: 'ask', autonomy: 'guided', docs: 'full', worktrees: 'off' };

function readProjectConfig(projectDir: string): { config: ProjectConfig; missing: boolean } {
  const file = join(projectDir, '.claude', 'project-config.json');
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as Partial<ProjectConfig>;
    const pick = <K extends keyof ProjectConfig>(k: K, allowed: ProjectConfig[K][]): ProjectConfig[K] =>
      allowed.includes(parsed[k] as ProjectConfig[K]) ? (parsed[k] as ProjectConfig[K]) : DEFAULTS[k];
    return {
      missing: false,
      config: {
        tdd: pick('tdd', ['auto', 'ask', 'disabled']),
        autonomy: pick('autonomy', ['agent', 'guided']),
        docs: pick('docs', ['full', 'off']),
        worktrees: pick('worktrees', ['on', 'off']),
      },
    };
  } catch {
    return { config: DEFAULTS, missing: true };
  }
}

// ── Skill rules ──────────────────────────────────────────────────────

interface SkillRule {
  priority?: 'critical' | 'high' | 'medium' | 'low';
  promptTriggers?: { keywords?: string[]; intentPatterns?: string[] };
}
interface SkillRules {
  skills: Record<string, SkillRule>;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole-word match: "ui" must not match "build", "form" must not match "format".
function wordMatch(prompt: string, phrase: string): boolean {
  return new RegExp(`(^|[^a-z0-9_])${escapeRegex(phrase.toLowerCase())}(?=$|[^a-z0-9_])`, 'i').test(prompt);
}

function matchSkills(prompt: string, rules: SkillRules): string[] {
  const matched: string[] = [];
  for (const [name, rule] of Object.entries(rules.skills)) {
    const t = rule.promptTriggers;
    if (!t) continue;
    const byKeyword = (t.keywords ?? []).some((kw) => wordMatch(prompt, kw));
    const byIntent = !byKeyword && (t.intentPatterns ?? []).some((p) => new RegExp(p, 'i').test(prompt));
    if (byKeyword || byIntent) matched.push(name);
  }
  return matched;
}

// ── Intent classifier ────────────────────────────────────────────────

type Category = 'FEATURE' | 'BUG' | 'QUESTION';

const BUG_WORDS = ['fix', 'fixes', 'fixing', 'fixed', 'bug', 'bugs', 'broken', 'regression', 'crash', 'crashes', 'crashing', 'throws', 'throwing'];
const BUG_PHRASES = ['not working', 'stopped working', "doesn't work", 'does not work', 'returns undefined', 'error when'];
const BUG_INTENTS = [/\bwhy (?:does|is) .* (?:fail|broken|wrong|not work)/i];

const FEATURE_WORDS = [
  'add', 'adds', 'adding', 'create', 'creates', 'creating', 'build', 'builds', 'building',
  'implement', 'implements', 'implementing', 'write', 'update', 'refactor', 'rename', 'extend',
  'migrate', 'wire', 'integrate', 'scaffold',
];
const FEATURE_PHRASES = ['new feature', 'support for', 'allow users to'];

// Question phrases are anchored to the start of the prompt (after an optional
// greeting) so "tell me what are the gaps" is not a question about gaps.
const QUESTION_START = /^\s*(?:hey|hi|hello|ok|okay|so)?[,\s]*(?:how (?:do|does|can|should)|what (?:is|are|does|do|would)|what'?s|why (?:is|does|do)|which|where (?:is|does|do)|when (?:is|does|do|should)|is there|are there|can you explain|explain|should (?:i|we)|do (?:i|we)|does)\b/i;

function classify(raw: string): Category | null {
  const p = raw.toLowerCase();
  if (BUG_WORDS.some((w) => wordMatch(p, w)) || BUG_PHRASES.some((s) => p.includes(s)) || BUG_INTENTS.some((r) => r.test(p))) return 'BUG';
  if (FEATURE_WORDS.some((w) => wordMatch(p, w)) || FEATURE_PHRASES.some((s) => p.includes(s))) return 'FEATURE';
  if (QUESTION_START.test(raw) || /\?\s*$/.test(raw)) return 'QUESTION';
  return null;
}

// ── Directives ───────────────────────────────────────────────────────

const RULES_BLOCK = `Pre-implementation rules (cite by ID, full text in vault/_conventions.md):
  convex/  PATH convex/features/<entity>/<purpose>[.public].ts (B-17) · B-01 args validators · B-05 requireAuth first
  src/     F-09 shadcn + cn() + Tailwind, no inline style · F-12 notFoundComponent on the route · F-03 loader args === useSuspenseQuery args`;

function tddLine(cat: Category, tdd: TddMode): string {
  if (tdd === 'disabled') return '';
  if (tdd === 'auto') {
    return cat === 'BUG'
      ? 'TDD (auto): reproduce with a failing test first (/generate-tests <file> or a targeted it.only), confirm RED, then fix without weakening the assertion.'
      : 'TDD (auto): run /generate-tests <target-file> before implementing; tests must fail first. Skip only for pure config/docs changes.';
  }
  return cat === 'BUG'
    ? 'TDD (ask): after the gate, ask "Reproduce with a failing test first?" and wait before reading code.'
    : 'TDD (ask): after the gate, ask "Start with tests?" and wait before reading code.';
}

function switchesLine(c: ProjectConfig): string {
  const parts: string[] = [];
  if (c.autonomy === 'agent') parts.push('autonomy=agent: after the gate and bounded discovery, go straight to /handoff-to-agent (no menu)');
  if (c.docs === 'off') parts.push('docs=off: skip feature-doc, /feature-sync and vault-note steps');
  if (c.worktrees === 'on') parts.push('worktrees=on: /dev dispatches dev-agent with isolation: worktree');
  return parts.length ? 'Switches — ' + parts.join(' · ') : '';
}

function fullDirective(cat: Category, c: ProjectConfig): string {
  if (cat === 'QUESTION') {
    return `Intent: QUESTION. Minimal context: grep first, open only the note that answers it, read a rule row not the whole file, prefer a 2–3 sentence answer.`;
  }
  const gate =
    cat === 'FEATURE'
      ? 'Gate: confirm 3 of 4 — WHAT, WHERE, WHO, ACCEPTANCE — before reading code. Fewer than 3: AskUserQuestion first.'
      : 'Gate: confirm 3 of 4 — REPRO, EXPECTED vs ACTUAL, WHERE, SCOPE — before reading code. Fewer than 3: AskUserQuestion first.';
  const load =
    cat === 'FEATURE'
      ? `Load: vault/_conventions.md (IDs only)${c.docs === 'full' ? ' → vault/project/features/<area>.md if present' : ''} → vault/_index.md "By task" → ≤2 notes.`
      : `Load: ${c.docs === 'full' ? 'vault/project/features/<feature>.md → ' : ''}vault/tech/<area>/*Anti-Patterns.md → vault/_conventions.md (IDs only).`;
  return [`Intent: ${cat}.`, gate, load, RULES_BLOCK, tddLine(cat, c.tdd), switchesLine(c)].filter(Boolean).join('\n');
}

function shortDirective(cat: Category, c: ProjectConfig): string {
  if (cat === 'QUESTION') return 'Intent: QUESTION — minimal context, grep first, short answer.';
  const gate = cat === 'FEATURE' ? 'gate WHAT/WHERE/WHO/ACCEPTANCE (3 of 4)' : 'gate REPRO/EXPECTED/WHERE/SCOPE (3 of 4)';
  const tdd = c.tdd === 'disabled' ? '' : `, TDD=${c.tdd}`;
  return `Intent: ${cat} — ${gate}, rules as shown earlier this session (B-xx/F-xx)${tdd}.`;
}

// ── Session state ────────────────────────────────────────────────────

function stateDir(projectDir: string, sessionId: string): string {
  return join(projectDir, '.claude', 'state', sessionId || 'default');
}

function writeIntent(dir: string, intent: string): void {
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'intent-state.json'), JSON.stringify({ intent, timestamp: Date.now() }));
  } catch {
    // advisory only
  }
}

function rulesAlreadyShown(dir: string): boolean {
  const flag = join(dir, 'rules-shown');
  if (existsSync(flag)) return true;
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(flag, String(Date.now()));
  } catch {
    // if we cannot record it, show the rules again next time
  }
  return false;
}

// ── Main ─────────────────────────────────────────────────────────────

interface HookInput {
  session_id?: string;
  prompt?: string;
}

function main(): void {
  const projectDir = process.env.CLAUDE_PROJECT_DIR;
  if (!projectDir) {
    console.error('skill-activation-prompt: CLAUDE_PROJECT_DIR is not set');
    process.exit(1);
  }

  let data: HookInput;
  try {
    data = JSON.parse(readFileSync(0, 'utf-8')) as HookInput;
  } catch {
    console.error('skill-activation-prompt: stdin was not JSON');
    process.exit(1);
  }
  const raw = data.prompt ?? '';
  if (!raw.trim()) process.exit(0);
  const prompt = raw.toLowerCase();
  const dir = stateDir(projectDir, data.session_id ?? '');

  // Explicit docs mode: nothing to suggest while editing the vault.
  if (['/docs', '[docs]', 'vault:', '/vault'].some((m) => prompt.includes(m))) {
    writeIntent(dir, 'DOCS');
    process.exit(0);
  }

  // Slash commands carry their own directive in the command body; only record intent.
  const slash = /^\s*\/(feature|bug|ask)\b/i.exec(raw);
  if (slash) {
    writeIntent(dir, { feature: 'FEATURE', bug: 'BUG', ask: 'QUESTION' }[slash[1].toLowerCase()] ?? 'UNKNOWN');
    process.exit(0);
  }

  const category = classify(raw);
  writeIntent(dir, category ?? 'UNKNOWN');

  const { config, missing } = readProjectConfig(projectDir);
  const rules = JSON.parse(readFileSync(join(projectDir, '.claude', 'skills', 'skill-rules.json'), 'utf-8')) as SkillRules;
  const skills = matchSkills(prompt, rules);

  const lines: string[] = [];
  if (missing) lines.push('[devkit] .claude/project-config.json is missing — run /setup-project. Using tdd=ask, autonomy=guided, docs=full, worktrees=off until then.');
  if (skills.length) lines.push(`[devkit] skills: ${skills.join(', ')} — invoke with the Skill tool before responding.`);
  if (category) {
    const shown = rulesAlreadyShown(dir);
    lines.push('[devkit] ' + (shown && category !== 'QUESTION' ? shortDirective(category, config) : fullDirective(category, config)));
  }
  if (lines.length) console.log(lines.join('\n'));
  process.exit(0);
}

main();
