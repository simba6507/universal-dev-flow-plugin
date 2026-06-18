#!/usr/bin/env node
// udflow plan gate: block Write/Edit/MultiEdit while permission mode is "plan".
// Cross-platform (runs on Node, which Claude Code already requires).
// Read-only/allow on any error so the hook never breaks a session.
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", () => {
  let allow = function () { process.exit(0); };
  try {
    const input = JSON.parse(raw || "{}");
    const tool = input.tool_name || "";
    const mode = input.permission_mode || "";
    const blocked = tool === "Write" || tool === "Edit" || tool === "MultiEdit";
    if (mode === "plan" && blocked) {
      const out = {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            "udflow plan gate: file modifications are blocked while in plan mode. Present the plan via ExitPlanMode and get approval before implementing."
        }
      };
      process.stdout.write(JSON.stringify(out));
      return process.exit(0);
    }
  } catch (e) { /* fall through to allow */ }
  return allow();
});
