# udflow — Universal Dev Flow (Claude Code plugin)

[![Validate](https://github.com/simba6507/universal-dev-flow-plugin/actions/workflows/validate.yml/badge.svg)](https://github.com/simba6507/universal-dev-flow-plugin/actions/workflows/validate.yml)

**English** · [繁體中文](README.zh-TW.md)

A risk-proportional, plan-gated multi-agent engineering workflow.
Understand → plan → **approve** → implement → verify → selected review → gatekeeper readiness verdict.

> In one line: udflow makes Claude Code lay out a plan and get your approval before it changes code, then has the right specialist reviewers check the work, and finishes with a gatekeeper verdict on whether it's shippable — instead of just saying "done."

> **Status: early / experimental.** The hooks are tested; the multi-agent orchestration is prompt-driven. Across two blind benchmarks (C#/.NET + Node/JS, 13 real bugs): **0 false positives**, but catch rate swings widely with reviewer panel size and bug subtlety (see the Evidence note below). Treat it as a disciplined scaffold.

<details>
<summary><b>Evidence (field notes)</b> — two blind benchmarks, directional (not yet a guarantee)</summary>

**Retroactive blind bug-catch (2026-06-19).** udflow's reviewers were run *blind* on the pre-fix code of **13 real historical bugs** across **two external repos / two languages** (C#/.NET and Node/JS — both different from this plugin's stack). Each reviewer saw only the buggy region — not the fix, not the issue, not the repo — and an independent judge scored its findings against the known defect.

| 13 real bugs · 2 repos · 2 languages · blind | Caught | Partial | Missed | False positives |
|---|---|---|---|---|
| outcome | **7** | 3 | 3 | **0** (of ~52 findings) |

- **Consistent signal — 0 false positives** across both repos and languages (~52 findings; ~46 more were plausible-but-unverified — thoroughness, not confirmed catches).
- **Catch rate is highly variable.** Run 1 (C#, with reviewer panels and several code-visible defects) caught **6/8**; Run 2 (Node/JS, a *single* reviewer on subtler bugs) caught only **1/5** (2 more partial). It depends heavily on (a) running the **full panel** vs one reviewer and (b) how subtle the bug is.
- **Caught well:** concrete, code-visible defects — resource leaks, a DB-column overflow, a `new URL()` that throws on a path-only input, a no-op form validator, a search index polluted with raw JSON.
- **Weak spots:** subtle language idioms (a wrong `this` binding), domain-knowledge bugs (RFC / dependency behavior), and omission-vs-intent defects (a missing cascade-delete; stats that should exclude binaries). A full 3-reviewer panel did **not** rescue the omission cases — the lever is feeding reviewers the *intent/spec*, not more reviewers. Sometimes a reviewer finds the defect but **under-rates its severity** (scored partial).

**Limits:** n=13, two repos; many bugs drawn from `fix` commits (Run 1 had a few previously surfaced by a review; Run 2's were all from issue/PR fixes); concurrency/integration bugs barely tested; reviewers got **no plan/requirements context** and Run 2 used a **single reviewer** — both *understate* a full udflow run. **Directional, not a guarantee.**

**Graduation criteria** — tracked in [`EVIDENCE.md`](EVIDENCE.md) (a manual log; udflow ships no telemetry). The "experimental" label comes off only when that log documents **≥3 external repos across ≥2 languages and ≥20 qualifying data points** (blind bug-catches or verified live tasks) with computed catch & false-positive rates, **at least half from bugs not previously found by a review**. Strict: only runs with a *verifiable ground truth* count — adoption/testimonials are tracked separately and don't move the rates. _Now: 2 repos · 2 languages · 13 points (languages ✓, anti-bias ✓; still need ≥3 repos and ≥20 points)._

</details>

---

## Quick start

Prerequisites: **Claude Code**, and `node --version` must work (the hooks are Node scripts — with no Node on PATH they silently do nothing).

**1. 🪟 In your terminal, go to your project and launch Claude Code**

    cd path/to/your-project
    claude

**2. 🤖 Inside Claude Code, install (run these three lines in order)**

    /plugin marketplace add simba6507/universal-dev-flow-plugin
    /plugin install udflow@kktmarketplace
    /reload-plugins

> The marketplace's name is `kktmarketplace` (not the repo name), so install is `udflow@kktmarketplace`.

**3. 🤖 Hand it a task**

    /udflow:run Fix the login flow so it refreshes when the token expires

You can also just describe the task in plain language — udflow takes over automatically when it judges the work to be non-trivial engineering.

> **Stays out of the way for small stuff.** udflow only engages for non-trivial engineering work; trivial edits and plain Q&A are left alone. Want to force the full workflow on anything? Use `/udflow:run`.

### Updating to a newer version

Already installed an older version? Refresh the marketplace and reload — no uninstall needed:

    /plugin marketplace update kktmarketplace
    /reload-plugins

Custom marketplaces do **not** auto-update, so run `marketplace update` manually. Check the installed version in `/plugin`.

### Troubleshooting

- **Install failed / can't find the plugin** — confirm the marketplace name: `/plugin marketplace list` should show `kktmarketplace`. Install is `udflow@kktmarketplace`, not `udflow@<repo>`.
- **Is the plan gate actually live?** Enter plan mode and ask Claude to edit a file — it should be blocked with a "udflow plan gate" message. If it isn't, the hook isn't firing (see next item).
- **Nothing seems to happen / gate never blocks** — check `node --version`. With no Node on PATH the hooks no-op silently. For deeper insight, set `UDFLOW_HOOK_DEBUG=1` to make the hooks write a trace (stderr / temp file); unset, they stay silent.
- **opus unavailable** — `security-reviewer` and `gatekeeper` fall back to the available model and say so in their output; verdict confidence may be lower.

---

## Example: roughly what a run looks like

Say you ask: "Add a *Remember me* checkbox to the login page." udflow walks you through it like this:

```
you> /udflow:run Add a "Remember me" checkbox to the login page

udflow> [understand] Restating: add a persisted "remember me" option on the login form.
        Clarifying: how long should the session be remembered? → asks via AskUserQuestion.
you> 30 days.

udflow> [plan / plan mode]  (read-only — no files changed yet)
        - Affected: login form component + the auth/session module
        - Approach: add checkbox → on submit, set a longer-lived session when checked
        - Verify: auth unit tests + open the page and confirm the checkbox works
        Presents the plan via ExitPlanMode and waits for approval.
you> approve

udflow> [implement] implementer makes the smallest change for the plan.
        [verify] runs tests/lint; opens the page and confirms the checkbox persists the session.
        [review] risk is UI + auth behavior → spec / test / ui-ux (+ security).
        [findings] test: missing a test for the unchecked default (major).
        [repair loop] adds the test → re-runs the affected reviewers → all pass.
        [gatekeeper] READY: requirement met, behavior verified, tests cover both paths.
```

Three things worth remembering:
- **Your files aren't touched before approval** — the plan is yours to approve.
- **Reviewers are selected by risk** — it doesn't spawn all of them every time.
- **Findings are auto-fixed and re-reviewed** — until the verdict is `READY` or it's clearly blocked.

---

## What you're opting into

- **More tokens than a normal chat.** A task spawns the `implementer`, the risk-selected reviewers, and the `gatekeeper` (two of them on `opus`). Rough cost for typical work: a few minutes and ~100–700k tokens; simple tasks cost less. Full table under [Cost per run](#cost-per-run).
- **Three always-on hooks, invisible during normal work** — a plan-mode write gate, failure-memory injection at session start, and a best-effort orchestration check at session end. They run in *every* session while the plugin is installed (not only udflow tasks); with no Node they no-op. Details under [Plan gate](#plan-gate) and [Failure memory](#failure-memory).
- **It writes failure-memory files** — `ai/FAILURE_MEMORY.md` in your repo and `~/.claude/FAILURE_MEMORY.md` at home (commit the project one or add it to `.gitignore`).
- **External models are off unless you ask** — Codex and MCP are opt-in; udflow runs standalone otherwise, and discloses any gap.
- **It can engage on its own — and you can stop it.** It auto-starts for non-trivial engineering work; to keep it manual-only, just don't describe engineering tasks in plain language and call `/udflow:run` when you want it. The repair loop has a hard cap (Stuck Summary after the same blocker persists two iterations) and asks before any deeper/opus-heavy pass.

---

## How it works

```
understand → plan (plan mode) → you approve → implement → verify → selected review → gatekeeper verdict
                                                                  ↑________ repair loop ________↓
```

- **Understand / plan** happen in plan mode (read-only); the plan is presented via ExitPlanMode for your approval.
- **Only after approval** does the `implementer` write code.
- **Verify** runs build / test / lint / typecheck / browser evidence as applicable.
- **Review** selects only the reviewers relevant to this change's risk (no ceremony).
- **gatekeeper** returns `READY` / `FIX REQUIRED` / `NOT READY`; if a fix is needed it enters a repair loop until ready or clearly blocked.

---

## Components

The plugin lives in the [`udflow/`](udflow/) subdirectory (only that subdir is installed; `test/`, `.github/`, and `package.json` stay at the repo root and are not shipped).

- `udflow/skills/universal-dev-flow/` — the auto-invoked orchestrator (with `references/`).
- `udflow/skills/run/` — manual entry point: `/udflow:run <task>`.
- `udflow/agents/` — 9 subagents: `implementer` (writes) + 7 read-only reviewers + `gatekeeper`. `security-reviewer` and `gatekeeper` run on `opus`; the rest inherit the current session model.
- `udflow/hooks/` — three Node hooks (same behavior on Windows, macOS, Linux; all fail-open):
  - `plan-gate.js` (PreToolUse) — blocks structured edits while in plan mode, exempting Claude Code's own plan files under `~/.claude/plans/`.
  - `load-failure-memory.js` (SessionStart) — injects a failure-memory digest.
  - `orchestration-check.js` (Stop) — best-effort, non-blocking: warns if a `READY` verdict is claimed without the review panel actually running.
- `udflow/.mcp.json` — empty by default (zero context cost). `udflow/mcp.example.json` is a copy-in template.

### The 9 subagents

| Agent | Role | When it's added | Model |
|-------|------|-----------------|-------|
| `implementer` | Implements the smallest safe change; never self-certifies | after the plan is approved | inherit |
| `spec-reviewer` | Requirement / business-rule / contract fidelity | core; always for non-trivial work | inherit |
| `test-reviewer` | Missing tests, weak verification, regression risk, edges | core; always for non-trivial work | inherit |
| `code-reviewer` | Local implementation quality, maintainability, framework usage, efficiency | non-trivial code changes | inherit |
| `security-reviewer` | Auth/authz, input handling, secrets, trust boundaries | security-relevant risk | opus |
| `architecture-reviewer` | Layering, boundaries, dependency direction, placement | structural/boundary concerns | inherit |
| `operability-reviewer` | Observability, retries/timeouts, deploy, rollback | runtime/production impact | inherit |
| `ui-ux-reviewer` | Usability, interaction, layout, states, accessibility | UI impact | inherit |
| `gatekeeper` | Aggregates and decides: READY / FIX REQUIRED / NOT READY | after selected reviewers finish | opus |

---

## Advanced

### Plan gate

The read-only enforcement is a hook that **only fires while you're in plan mode**. udflow drives Claude Code's native plan mode itself for its planning phase, so the gate is live even when your default mode isn't plan. If the runtime can't switch modes programmatically, udflow proceeds read-only by discipline and **discloses** that the hook isn't enforcing this session; for a hard, every-session guarantee, set a default plan mode in `~/.claude/settings.json` or the project's `.claude/settings.json` (the plugin doesn't force it).

```
you> add a promo-code field to the checkout page
udflow> [enters plan mode] tries to edit checkout.tsx → ✗ blocked ("udflow plan gate")
        → plans instead, presents the plan via ExitPlanMode
you> approve
udflow> [exits plan mode] now edits checkout.tsx ✓
```

Two honest limits:
- **It's global.** The hook runs in every session while installed, so if you're in plan mode in an unrelated project, edits there are blocked too — it doesn't know whether the session is a udflow task.
- **Bash is only partly covered.** The hook blocks the structured edit tools and the *obvious* Bash writes (`>`/`>>` to a file, `tee`, `sed -i`, `git apply`), but deliberately allows read-only Bash and won't catch non-obvious writes (e.g. `python -c "open(...,'w')"`). Treat the tripwire as a safety net — udflow's rules still forbid any Bash working-tree write while planning.

### Failure memory

udflow records "execution abnormalities that blocked, disrupted, or forced repair of the intended method" as plain Markdown, so future sessions read past lessons on startup. Two files (either or both): project `ai/FAILURE_MEMORY.md`, global `~/.claude/FAILURE_MEMORY.md`.

- **Startup digest (automatic).** The SessionStart hook injects a condensed digest (each entry's title + prevention rule + tags, newest first, capped) — project first → global fallback. It's a small index, not the whole file; injected content is fenced as untrusted reference data. No file → nothing happens.
- **Targeted recall (during planning).** The workflow retrieves the full entries relevant to the affected files / area / language / `Tags` — only relevant lessons surface.
- **Writes** are routed by the lesson's nature (project-specific → project, cross-project → global, both → both), always rereading the global file first to merge instead of duplicating, and performed by a single writer (the main thread / `gatekeeper`) to avoid concurrent corruption. Size is kept down by consolidation, not truncation. A filled-in example: [`udflow/examples/FAILURE_MEMORY.sample.md`](udflow/examples/FAILURE_MEMORY.sample.md).

### Deep mode (opt-in)

Prefix a task with `--deep` (e.g. `/udflow:run --deep <task>`) — or work in a session where an ultracode/Workflow capability is on — to run the **same** selected reviewers more rigorously: the panel and gatekeeper run as a deterministic Workflow (so the panel actually runs), blocker/major findings get adversarial verification, and the highest-leverage agents run at higher effort. **Depth, not more reviewers.** It's off by default, never a hard dependency, and falls back silently to the standard flow (with disclosure) if the capability isn't available.

### Cost per run

Ballpark from real runs — varies a lot by task size, risk, and number of fix iterations; treat as orders of magnitude, not guarantees:

| Task | Reviewers | Tokens | Wall-clock |
|------|-----------|--------|------------|
| Light | core only | ~100–250k | a few min |
| Typical | 3–5 + one repair pass | ~300–700k | ~5–15 min |
| Deep | `--deep`, several repair loops | >1M | 20–40 min |

`opus` reviewers and extra fix iterations raise both; running reviewers in parallel shortens wall-clock.

### Optional external capabilities (Detect → Use → Else-Disclose)

MCP tools, external subagents, and external skills are all **optional**. If present, they're used; if absent, the work is done locally and the gap is disclosed. See `udflow/skills/universal-dev-flow/references/external-capabilities.md`.

- **MCP per reviewer**: disabled by default. To enable, copy a server from `udflow/mcp.example.json` into `udflow/.mcp.json`, then uncomment the matching `mcp__*` line in that reviewer's `tools:`. Keep reviewers read-only.
- **ui-ux-pro-max**: if the `ui-ux-pro-max` skill is installed, udflow uses it first for UI design decisions; otherwise it falls back to a built-in baseline and discloses that.
- **Codex (second opinion / rescue)**: **off by default** — only when you explicitly enable it for a task. When enabled and installed, udflow may delegate one independent diagnosis on a stuck fix; it sends code/context to an external (OpenAI) model at extra cost. If not enabled or not installed, udflow continues locally without error.

---

## License

[MIT](LICENSE) · See [CHANGELOG.md](CHANGELOG.md) for version history.
