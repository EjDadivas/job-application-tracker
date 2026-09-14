#!/usr/bin/env node
// Devkit hygiene check — zero dependencies, Node 22+ ESM.
//
//   a. every [[wikilink]] in vault/, .claude/ and CLAUDE.md resolves to a vault note
//   b. every backticked vault/ or .claude/ path in .claude/ and CLAUDE.md exists
//   c. skill-rules.json keys <-> .claude/skills/<key>/SKILL.md, with valid frontmatter
//   d. every hook command in .claude/settings.json exists and is executable
//
// Prints `<file>:<line> <reason>` per failure and exits 1 if any.

import { readFileSync, readdirSync, statSync, accessSync, constants } from "node:fs";
import { join, relative, basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (file, line, reason) =>
  failures.push(`${relative(ROOT, file)}${line ? `:${line}` : ""} ${reason}`);

function walk(dir, ext, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      walk(p, ext, out);
    } else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const exists = (p) => {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
};

/** Parse a simple YAML frontmatter block into { key: rawValue }. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return null;
  const out = {};
  let cur = null;
  for (const raw of m[1].split(/\r?\n/)) {
    const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      cur = kv[1];
      out[cur] = kv[2].trim();
    } else if (cur && /^\s+-\s+/.test(raw)) {
      // block-style list item under the current key
      out[cur] = (out[cur] ? out[cur] + "," : "") + raw.replace(/^\s+-\s+/, "").trim();
    }
  }
  return out;
}

/** aliases: [a, b] | ["a", 'b'] | block list -> ["a", "b"] */
function parseAliases(raw) {
  if (!raw) return [];
  return raw
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/** Strip fenced code blocks and inline backticks, preserving line numbers. */
function stripCode(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  return lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    if (inFence) return "";
    return line.replace(/`[^`]*`/g, "");
  });
}

// ---------------------------------------------------------------- vault index
const VAULT = join(ROOT, "vault");
const vaultNotes = walk(VAULT, ".md");
const byBasename = new Set();
const byPath = new Set();
const byAlias = new Set();
for (const p of vaultNotes) {
  const rel = relative(VAULT, p).replace(/\\/g, "/").replace(/\.md$/, "");
  byPath.add(rel.toLowerCase());
  byBasename.add(basename(rel).toLowerCase());
  const fm = frontmatter(readFileSync(p, "utf8"));
  for (const a of parseAliases(fm?.aliases)) byAlias.add(a.toLowerCase());
}

const resolvesWikilink = (target) => {
  const t = target.toLowerCase().replace(/\.md$/, "");
  return byPath.has(t) || byBasename.has(basename(t)) || byAlias.has(t);
};

const isPlaceholderLink = (t) =>
  /[<>]/.test(t) || /NNNN|YYYY|file1|file2/.test(t) || t.startsWith("0003-") || /^(SPEC|ROADMAP)$/.test(t);

// ------------------------------------------------------------- a. wikilinks
const CLAUDE_DIR = join(ROOT, ".claude");
const mdSources = [...vaultNotes, ...walk(CLAUDE_DIR, ".md"), join(ROOT, "CLAUDE.md")].filter(exists);

let linkCount = 0;
for (const file of mdSources) {
  const lines = stripCode(readFileSync(file, "utf8"));
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\[\[([^\]]+?)\]\]/g)) {
      const target = m[1].split("|")[0].split("#")[0].trim();
      if (!target || isPlaceholderLink(target)) continue;
      linkCount++;
      if (!resolvesWikilink(target)) fail(file, i + 1, `broken wikilink [[${target}]]`);
    }
  });
}

// --------------------------------------------------------- b. backticked paths
const pathSources = [...walk(CLAUDE_DIR, ".md"), join(ROOT, "CLAUDE.md")].filter(exists);
const PATH_RE = /`((?:vault|\.claude)\/[^`\s]+?\.(?:md|json|ts|sh))`/g;
let pathCount = 0;
for (const file of pathSources) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    for (const m of line.matchAll(PATH_RE)) {
      const p = m[1];
      if (/[<>{}*]/.test(p)) continue; // placeholders and shell globs
      if (p.startsWith("vault/project/") || p.startsWith("vault/local/")) continue;
      // Written at runtime by /setup-project, /generate-tests and the hooks.
      if (p.startsWith(".claude/project-config.") || p.startsWith(".claude/state/")) continue;
      pathCount++;
      if (!exists(join(ROOT, p))) fail(file, i + 1, `missing path \`${p}\``);
    }
  });
}

// ------------------------------------------------------------------ c. skills
const SKILLS_DIR = join(CLAUDE_DIR, "skills");
const rulesFile = join(SKILLS_DIR, "skill-rules.json");
let skillCount = 0;
if (!exists(rulesFile)) {
  fail(rulesFile, 0, "skill-rules.json not found");
} else {
  let rules;
  try {
    rules = JSON.parse(readFileSync(rulesFile, "utf8"));
  } catch (e) {
    fail(rulesFile, 0, `invalid JSON: ${e.message}`);
  }
  for (const key of Object.keys(rules?.skills ?? {})) {
    if (!exists(join(SKILLS_DIR, key, "SKILL.md")))
      fail(rulesFile, 0, `skill "${key}" has no .claude/skills/${key}/SKILL.md`);
  }
}
let skillDirs = [];
try {
  skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
} catch {
  fail(SKILLS_DIR, 0, "skills directory not found");
}
for (const d of skillDirs) {
  const skillFile = join(SKILLS_DIR, d.name, "SKILL.md");
  if (!exists(skillFile)) continue;
  skillCount++;
  const fm = frontmatter(readFileSync(skillFile, "utf8"));
  if (!fm) {
    fail(skillFile, 1, "missing YAML frontmatter");
    continue;
  }
  const name = (fm.name ?? "").replace(/^["']|["']$/g, "");
  if (name !== d.name) fail(skillFile, 2, `frontmatter name "${name}" != folder "${d.name}"`);
  const desc = (fm.description ?? "").replace(/^["']|["']$/g, "").trim();
  if (!desc) fail(skillFile, 2, "frontmatter description is empty");
}

// ------------------------------------------------------------------- d. hooks
const settingsFile = join(CLAUDE_DIR, "settings.json");
if (!exists(settingsFile)) {
  fail(settingsFile, 0, "settings.json not found");
} else {
  let settings = {};
  try {
    settings = JSON.parse(readFileSync(settingsFile, "utf8"));
  } catch (e) {
    fail(settingsFile, 0, `invalid JSON: ${e.message}`);
  }
  for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
    for (const group of groups ?? []) {
      for (const hook of group.hooks ?? []) {
        if (hook.type !== "command" || !hook.command) continue;
        // Only the leading program path is checked; args are ignored.
        const cmd = hook.command.split(/\s+/)[0].replace(/\$CLAUDE_PROJECT_DIR/g, ROOT).replace(/^"|"$/g, "");
        if (!exists(cmd)) {
          fail(settingsFile, 0, `${event} hook missing: ${relative(ROOT, cmd)}`);
          continue;
        }
        try {
          accessSync(cmd, constants.X_OK);
        } catch {
          fail(settingsFile, 0, `${event} hook not executable: ${relative(ROOT, cmd)}`);
        }
      }
    }
  }
}

// ------------------------------------------------------------------- report
if (failures.length) {
  for (const f of failures) console.error(f);
  console.error(`\ndevkit check: ${failures.length} failure${failures.length === 1 ? "" : "s"}`);
  process.exit(1);
}
console.log(`devkit check: ok (${linkCount} links, ${pathCount} paths, ${skillCount} skills)`);
