#!/usr/bin/env node
// udflow SessionStart: inject a compact FAILURE_MEMORY *digest* into context.
// Prefer project ai/FAILURE_MEMORY.md, else global ~/.claude/FAILURE_MEMORY.md.
// The digest is a condensed index (entry title + prevention rule + tags, newest
// first, capped) — NOT the whole file. Full entries are retrieved on demand
// during planning. Never crash a session: exit 0 with no output on any problem.
const fs = require("fs");
const os = require("os");
const path = require("path");

const MAX_ENTRIES = 20;   // newest N entries in the digest
const MAX_CHARS = 3000;   // safety cap on the injected body

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", () => {
  try {
    let cwd = process.cwd();
    try { const i = JSON.parse(raw || "{}"); if (i.cwd) cwd = i.cwd; } catch (e) {}

    const projectPath = path.join(cwd, "ai", "FAILURE_MEMORY.md");
    const globalPath = path.join(os.homedir(), ".claude", "FAILURE_MEMORY.md");

    let chosen = null;
    if (fs.existsSync(projectPath)) chosen = projectPath;
    else if (fs.existsSync(globalPath)) chosen = globalPath;
    if (!chosen) return process.exit(0);

    const content = fs.readFileSync(chosen, "utf8");
    const body = buildDigest(content) || buildFallback(content);
    if (!body) return process.exit(0);

    const out = {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          "Failure memory digest (" + chosen + ") — past lessons to avoid repeating. " +
          "This is a condensed index; during planning, read the full file and retrieve the entries relevant to the task.\n\n" +
          body
      }
    };
    process.stdout.write(JSON.stringify(out));
  } catch (e) { /* no-op: fail open */ }
  return process.exit(0);
});

// Parse "### " entries (newest first by convention) into one-line summaries:
// "- <title> — <prevention rule>  [tags: ...]". Returns null when the file is
// not structured with "### " headings (caller then uses buildFallback).
function buildDigest(content) {
  const lines = content.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^###\s+/.test(lines[i])) starts.push(i);
  }
  if (starts.length === 0) return null;

  const items = [];
  for (let s = 0; s < starts.length && items.length < MAX_ENTRIES; s++) {
    const startLine = starts[s];
    const endLine = (s + 1 < starts.length) ? starts[s + 1] : lines.length;
    const title = lines[startLine].replace(/^###\s+/, "").trim();
    if (/^<.*>$/.test(title)) continue; // skip the "### <YYYY-MM-DD> — <title>" template placeholder
    let rule = "", tags = "";
    for (let j = startLine + 1; j < endLine; j++) {
      let m;
      if (!rule && (m = lines[j].match(/prevention rule\**\s*:?\s*(.+)$/i))) rule = m[1].replace(/^\**\s*/, "").trim();
      if (!tags && (m = lines[j].match(/^\s*[-*]?\s*\**\s*tags\**\s*:?\s*(.+)$/i))) tags = m[1].replace(/^\**\s*/, "").replace(/[.\s]+$/, "").trim();
    }
    let line = "- " + title;
    if (rule) line += " — " + rule;
    if (tags) line += "  [tags: " + tags + "]";
    items.push(line);
  }
  if (items.length === 0) return null;

  // entry-aware char cap: drop whole trailing lines, never cut mid-line
  const kept = [];
  let used = 0;
  for (const it of items) {
    if (used + it.length + 1 > MAX_CHARS) break;
    kept.push(it);
    used += it.length + 1;
  }
  const omitted = starts.length - kept.length;
  const note = omitted > 0
    ? "\n\n(" + omitted + " older entries omitted; the full list is in the file.)"
    : "";
  return kept.join("\n") + note;
}

// Fallback for files that do not follow the template: keep the newest (top)
// content, cut on a line boundary so an entry is never split mid-line.
function buildFallback(content) {
  if (!content.trim()) return null;
  if (content.length <= MAX_CHARS) return content.trim();
  const slice = content.slice(0, MAX_CHARS);
  const lastNl = slice.lastIndexOf("\n");
  const safe = (lastNl > 0 ? slice.slice(0, lastNl) : slice).trimEnd();
  return safe + "\n\n[...truncated to the newest content; read the file for the rest]";
}
