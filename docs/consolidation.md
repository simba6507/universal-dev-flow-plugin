# Consolidation freeze (v0.27.x)

> Status: **ACTIVE**. udflow is in a deliberate *consolidation* phase. The goal is to
> harden, align, and prove what already exists — **not** to add capability — until the
> exit criteria below are met.

## Why

The plugin's surface area (10 agents, 5 hooks, ~15 references, design contract, deep-mode
tiers, MCP seams, browser/app-launch capabilities) has outgrown its **validated** value:
the real-world evidence is still thin (a handful of logged runs, all by the maintainer),
and at least one shipped feature (`compact-fidelity`, 0.27.0–0.27.2) was silently broken
for three releases because the prompt-driven core has no regression net. The
complexity-to-validated-value ratio is the project's top risk. So: stop widening, start
deepening.

## The freeze policy

**Blocked during the freeze**
- New agents, hooks, references, run flags, or deep-mode capabilities.
- Any change whose primary effect is *more behavior*.

**Allowed during the freeze**
- Bug fixes.
- Test / regression hardening.
- Documentation alignment and dead-prose / dead-flag removal (surface shrink).
- Evidence work (re-tests, logging real runs).

A change that adds capability "while we're in here" is exactly what this freeze exists to
stop. When in doubt, it's blocked.

## Workstreams

1. **Shrink surface area.** Audit every agent / hook / reference / flag against evidence of
   use; consolidate overlaps; remove what isn't earning its keep. Align SKILL.md ↔
   references ↔ README ↔ agents so they cannot contradict each other.
2. **Regression-test the core.** The prompt-driven workflow cannot be unit-tested, so test
   the deterministic seams instead, in layers:
   - **L1 (every commit, no model):** reviewer-selection rules; a *prose-invariant* guard
     that fails CI if an agent file loses its load-bearing contract phrases (the fix for
     "prose drift caught by luck"). Extends `validate-structure.mjs`.
   - **L2 (version bumps, cheap model):** a few fixed-diff golden fixtures → run the
     workflow → assert *structure* (right reviewers, verdict literal, sentinel present, no
     crash), not verbatim output.
   - **L3 (periodic / major changes):** the 32-bug curated benchmark subset on the current
     build + model, repo-native intent, **independent** judge → catch/FP vs baseline.
3. **Make value & cost legible.** Keep the 60-second value framing and the public demo
   up front; keep the per-run cost ballparks honest and reconciled with the logged runs;
   default to the leanest useful panel, heavy panels as explicit opt-in.
4. **Thicken the evidence — honestly.** Publish a current-build re-test number (L3); the
   binding goal is **≥1 real run not by the maintainer**. Never add features to compensate
   for thin evidence.

## Exit criteria

**Un-freeze (may resume capability work) when ALL hold:**
- [x] L1 regression guards are in CI and green (prose drift is caught automatically). — `validate-structure.mjs` **5f contract-invariant guard**: asserts the verbatim machine literals (verdict / severity / sentinel tokens) survive in the files that own them (gatekeeper, reviewer-common, reviewer-selection, SKILL.md).
- [ ] README 60-second value + reconciled cost section shipped.
- [ ] Surface-area audit complete (consolidation pass done).
- [ ] A current-build re-test number is published in `EVIDENCE.md`.

**Drop the "experimental" label (a separate, higher bar — adoption-driven, not code):**
- [ ] ≥10 verified real runs, across ≥3 projects, **with ≥1 not by the maintainer**.

## Tooling note (how each item is executed)

- **udflow's own behavioral changes** (surface removal, regression-test code) → run them
  *through udflow* (dogfood; each run is also an evidence data point).
- **Docs / config alignment** → plain edits + the normal PR/CI flow (running udflow's full
  panel on prose would violate its own pragmatism axiom).
- **Audits / benchmark evals** → read-only exploration / a verification workflow with an
  independent judge — not udflow.
