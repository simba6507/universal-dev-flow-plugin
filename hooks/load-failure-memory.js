#!/usr/bin/env node
// udflow SessionStart: inject FAILURE_MEMORY into context.
// Prefer project ai/FAILURE_MEMORY.md, else global ~/.claude/FAILURE_MEMORY.md.
// Never crash a session: exit 0 with no output on any problem.
const fs = require("fs");
const os = require("os");
const path = require("path");

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

    let content = fs.readFileSync(chosen, "utf8");
    const LIMIT = 12000;
    if (content.length > LIMIT) {
      content = content.slice(0, LIMIT) + "\n\n[...truncated; read " + chosen + " for the rest]";
    }

    const out = {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          "Failure memory (" + chosen + ") — review before non-trivial implementation:\n\n" + content
      }
    };
    process.stdout.write(JSON.stringify(out));
  } catch (e) { /* no-op */ }
  return process.exit(0);
});
