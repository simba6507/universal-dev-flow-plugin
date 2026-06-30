# Compatibility and conformance

udflow targets Claude Code first. Its behavior depends on Claude Code plan mode, hook event/output schemas, subagent isolation, Workflow capability, and Stop-hook surfacing of sentinels. Those contracts can move, so compatibility is recorded explicitly rather than assumed.

## Tested-against matrix

| udflow version | Runtime | Version / date | Node | OS | Plan gate | Stop sentinel | Subagents | Workflow | Status |
|---|---|---|---|---|---|---|---|---|---|
| 0.27.x | Claude Code | compaction-fidelity `SessionStart`·`compact` live-smoked on 2026-06-28; full checklist required per release | 20.x in CI | manual smoke environment | manual smoke required | manual smoke required | manual smoke required | manual smoke required when available | supported |
| 0.27.x | GitHub Copilot CLI | 1.0.65 live load verification | 20.x in CI | local live verification | no-op, runtime lacks permission-mode hook field | no-op, Stop output not surfaced | loads | no Workflow capability | supported with notes |
| current branch | CI structural checks | every PR / push | 20.x | Ubuntu / Windows / macOS | hook tests | hook tests | manifest checks | not exercised | regression net |

`EVIDENCE.md`, `RELEASING.md`, and the README are the human-facing source for live-smoke details. `.github/scripts/validate-structure.mjs` and `npm test` are the automated regression net.

## Claude-Code-only behavior

These features degrade outside Claude Code:

- `plan-gate.js` needs a permission-mode field in `PreToolUse` input.
- `compact-fidelity.js` relies on `SessionStart` injected output being surfaced.
- `orchestration-check.js` relies on Stop-hook output being surfaced.
- Deep-mode Workflow requires a runtime Workflow capability.

The plugin should fail open and disclose gaps rather than erroring when a capability is unavailable.

## Conformance smoke checklist

Run this in a clean Claude Code profile before or right after a release that touches hooks, `hooks.json`, skills, agents, manifests, or hook-output contracts:

1. Install, enable, and reload the plugin from the marketplace.
2. Confirm `load-failure-memory.js` injects a nonce-fenced digest when `ai/FAILURE_MEMORY.md` exists and stays silent when no file exists.
3. Enter plan mode and confirm `plan-gate.js` denies an edit but allows the same edit outside plan mode.
4. Confirm `destructive-guard.js` asks before a narrow destructive command such as `git reset --hard`.
5. End a session that claims `READY` without a reviewer panel and confirm `orchestration-check.js` advises.
6. Trigger `/compact` and confirm `compact-fidelity.js` emits the `SessionStart`·`compact` preservation block without `Hook JSON output validation failed`.
7. Run `/udflow:doctor` and save the health summary if any hook is degraded.
8. Run `/udflow:run <non-trivial task>` and confirm the universal-dev-flow skill engages.

Record the runtime version, Node version, OS, and any degraded behavior in the release PR or `EVIDENCE.md`.

After a real compatibility run, open a [Verified udflow run issue](https://github.com/kktu6507/universal-dev-flow-plugin/issues/new?template=verified-run.yml) and paste the `### Live run` block so the public evidence log can be updated without changing the issue template.

## Conformance smoke files

Markdown smoke scenarios can live under `test/conformance/` when a release needs a manual checklist artifact rather than automated tests:

- `plan-gate-smoke.md`
- `stop-sentinel-smoke.md`
- `destructive-guard-smoke.md`

These files are optional documentation. The authoritative automated checks remain `node .github/scripts/validate-structure.mjs` and `npm test`.
