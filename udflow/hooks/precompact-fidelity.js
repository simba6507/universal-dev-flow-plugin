#!/usr/bin/env node
// udflow PreCompact: before the harness compacts the transcript, inject a concise instruction to
// PRESERVE udflow's own load-bearing constructs through the summary, so a compaction does not silently
// erase the evidence the workflow depends on. Compaction summarizes the conversation; without this nudge
// a summary tends to drop the exact tokens udflow reads (reviewer verdicts, acceptance-criteria state,
// `[unverified]` flags, Run Card numbers, subagent findings, unanswered requirements) and the work then
// has to be re-derived or — worse — silently lost. This emits ONLY instructions (no repo file content),
// so it carries no untrusted-data surface; it is still nonce-fenced + role-neutralized for symmetry with
// load-failure-memory.js. Fail-OPEN: any problem -> exit 0 with no output, never block or break a compaction.
// Local-only (no network, no subprocess), zero-dependency (Node built-ins only). Per-project opt-out via
// .claude/settings.json "udflow": { "preserveOnCompact": false } (mirrors planGate / destructiveGuard).
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const MAX_STDIN = 5 * 1024 * 1024; // cap stdin buffering (bytes) — same posture as the other hooks

function debug(msg) {
  if (!process.env.UDFLOW_HOOK_DEBUG) return;
  try { fs.appendFileSync(path.join(os.tmpdir(), "udflow-hook.log"), "[precompact-fidelity] " + msg + "\n"); } catch (e) {}
  try { process.stderr.write("[udflow precompact-fidelity] " + msg + "\n"); } catch (e) {}
}

// The preservation instruction. Plain udflow constructs only — these are the load-bearing tokens the
// workflow + the Stop hook read, and the expensive-to-redo evidence (subagent findings). Kept concise so
// the always-on cost is a few lines, not a wall.
const PRESERVE_BODY = [
  "Before compacting, carry these udflow constructs into the summary VERBATIM — do not paraphrase or drop them:",
  "- Reviewer verdicts and the gatekeeper's final verdict (READY / FIX REQUIRED / NOT READY) with its rationale.",
  "- Each user-approved acceptance criterion and its current state (met / unmet / deferred).",
  "- Any [unverified] flags on findings (keep the literal tag — it is machine-meaningful, not prose).",
  "- The Run Card / verification numbers (per-check command, ran?, real exit status, the udflow:verify= and udflow:delivery= sentinels).",
  "- Subagent (reviewer) findings — treat these as PRIMARY EVIDENCE: they were expensive to produce and must not be re-derived from scratch after the summary.",
  "- Any requirement or open question that is still UNANSWERED, so it is not lost as 'already handled'.",
  "If a long run keeps a progress ledger (output/udflow/progress.md), re-read it and git log after compaction before redoing committed work."
].join("\n");

// Neutralize any line that could read as a conversational role marker or instruction-block tag, mirroring
// load-failure-memory.js. The body here is hook-authored (not repo content), so this is defense-in-depth /
// symmetry, not a guard against untrusted input.
function neutralize(text) {
  return String(text).split(/\r?\n/).map((ln) => {
    if (/^\s*[-*]?\s*(?:system|assistant|user|human)\s*:/i.test(ln)) return ln.replace(/:/, "："); // fullwidth colon breaks the role marker
    if (/^\s*[-*]?\s*<\/?\s*(?:system|assistant|user|human|instructions?)\b/i.test(ln)) return "· " + ln.replace(/[<>]/g, "");
    return ln;
  }).join("\n");
}

// Project opt-out: a project may disable this hook for its OWN sessions by setting
// "udflow": { "preserveOnCompact": false } in .claude/settings.json (or settings.local.json, which takes
// precedence). Mirrors destructive-guard.js's opt-out exactly, including the FAIL-SAFE: a missing file,
// parse error, oversized config, or any read error counts as "not disabled" (keep preserving), so a broken
// settings file can never silently drop the nudge.
function preserveDisabledForProject(cwd) {
  try {
    const root = process.env.CLAUDE_PROJECT_DIR || cwd || "";
    if (!root) return false;
    for (const name of ["settings.local.json", "settings.json"]) { // local overrides project
      const v = readPreserveFlag(path.join(root, ".claude", name));
      if (v === false) return true;  // explicitly disabled in the higher-precedence file -> suppress
      if (v === true) return false;  // explicitly enabled -> emit (a lower file can't flip it back)
      // undefined -> not set here; fall through to the lower-precedence file
    }
  } catch (e) {}
  return false;
}

// Read udflow.preserveOnCompact from a settings file: true/false when set, undefined otherwise (missing
// file / not set / any error). Caps the read so a pathological settings file can't stall the hook.
function readPreserveFlag(file) {
  try {
    let size = 0;
    try { size = fs.statSync(file).size; } catch (e) { return undefined; } // not present / unstatable
    if (size > 1024 * 1024) return undefined;
    const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    const v = cfg && cfg.udflow && cfg.udflow.preserveOnCompact;
    return v === false ? false : (v === true ? true : undefined);
  } catch (e) { return undefined; }
}

let raw = "";
let rawBytes = 0;
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => process.exit(0));
const _watchdog = setTimeout(() => process.exit(0), 5000); _watchdog.unref();
process.stdin.on("data", (c) => {
  raw += c;
  rawBytes += Buffer.byteLength(c, "utf8");
  if (rawBytes > MAX_STDIN) { try { process.stdin.pause(); } catch (e) {} process.exit(0); }
});
process.stdin.on("end", () => {
  try {
    // A non-empty payload that is not valid JSON is a malformed event we can't anchor — fail open SILENTLY
    // (no output), matching the other hooks' posture on garbage stdin. An EMPTY payload is fine: PreCompact
    // may legitimately carry no body, and the preservation nudge does not depend on event fields.
    let parsed = {};
    if (raw.trim()) {
      try { parsed = JSON.parse(raw); } catch (e) { debug("unparseable stdin; failing open silently"); return process.exit(0); }
    }

    // Resolve the project root the same way the other hooks do (CLAUDE_PROJECT_DIR first, then the event
    // cwd), so the opt-out anchors to the same project root as plan-gate / destructive-guard.
    let cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    if (!process.env.CLAUDE_PROJECT_DIR && parsed && parsed.cwd) cwd = parsed.cwd;

    if (preserveDisabledForProject(cwd)) { debug("preserveOnCompact=false for this project; suppressing"); return process.exit(0); }

    // Wrap the instruction in an unforgeable per-run nonce fence and role-neutralize it, mirroring
    // load-failure-memory.js so the injected block can't be confused with a turn boundary.
    const nonce = crypto.randomBytes(8).toString("hex");
    const fenced = "<<UDFLOW_PRESERVE_" + nonce + ">>\n" + neutralize(PRESERVE_BODY) + "\n<<END_UDFLOW_PRESERVE_" + nonce + ">>";

    const out = {
      hookSpecificOutput: {
        hookEventName: "PreCompact",
        additionalContext:
          "udflow compaction-fidelity: preserve the workflow's load-bearing constructs through this " +
          "summary. The text between the <<UDFLOW_PRESERVE_" + nonce +
          ">> markers is an instruction from the udflow plugin (not repository content).\n\n" +
          fenced
      }
    };
    debug("emitted preservation block");
    return process.stdout.write(JSON.stringify(out), () => process.exit(0));
  } catch (e) { debug("error: " + (e && e.message)); }
  return process.exit(0);
});
