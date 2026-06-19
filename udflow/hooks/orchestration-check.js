#!/usr/bin/env node
// udflow Stop hook (best-effort, non-blocking): if the session's final message asserts a
// READY verdict but the core review panel (spec-reviewer, test-reviewer, gatekeeper) did
// not actually run as independent subagents, surface a non-blocking reminder.
// Always fail-open: exit 0, never block the stop, never crash. If the transcript can't be
// parsed (format differs), it simply does nothing — absence equals current behavior.
const fs = require("fs");
const os = require("os");
const path = require("path");

const REQUIRED = ["spec-reviewer", "test-reviewer", "gatekeeper"];

function debug(msg) {
  if (!process.env.UDFLOW_HOOK_DEBUG) return;
  try { fs.appendFileSync(path.join(os.tmpdir(), "udflow-hook.log"), "[orchestration-check] " + msg + "\n"); } catch (e) {}
  try { process.stderr.write("[udflow orchestration-check] " + msg + "\n"); } catch (e) {}
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => process.exit(0));
const _wd = setTimeout(() => process.exit(0), 5000); _wd.unref();
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const tpath = input.transcript_path || input.transcriptPath || "";
    if (!tpath || !fs.existsSync(tpath)) return process.exit(0);

    const text = fs.readFileSync(tpath, "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);

    // Did the panel actually run? Look for the reviewer/gatekeeper subagent types anywhere.
    const ran = new Set();
    for (const name of REQUIRED) {
      const re = new RegExp("(?:subagent_type|agentType|agent_type)\"?\\s*[:=]\\s*\"?[^\"]*" + name, "i");
      if (re.test(text)) ran.add(name);
    }

    // Did the final assistant message assert a READY verdict?
    let finalText = "";
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const obj = JSON.parse(lines[i]);
        const role = obj.role || (obj.message && obj.message.role) || obj.type;
        if (role === "assistant") { finalText = JSON.stringify(obj); break; }
      } catch (e) {}
    }
    const assertsReady = /\bREADY\b/.test(finalText) && /verdict|gatekeeper|readiness/i.test(finalText);
    debug("assertsReady=" + assertsReady + " ran=[" + [...ran].join(",") + "]");

    // Conservative on purpose: only warn when a READY verdict is asserted AND NONE of the
    // core panel agents appear anywhere in the transcript (high-confidence "panel clearly
    // never ran"). This avoids false reminders if the real transcript serializes subagents
    // under a shape this scan doesn't match — a fail-open advisory must not cry wolf.
    if (assertsReady && ran.size === 0) {
      const msg = "udflow: a READY verdict was asserted but none of the core review panel " +
        "(spec-reviewer, test-reviewer, gatekeeper) appears to have run as a subagent this session. " +
        "A self-review is not a formal multi-agent review — run the panel, or downgrade to FIX REQUIRED and disclose it as local self-review.";
      return process.stdout.write(JSON.stringify({ systemMessage: msg }), () => process.exit(0));
    }
  } catch (e) { debug("error: " + (e && e.message)); }
  return process.exit(0);
});
