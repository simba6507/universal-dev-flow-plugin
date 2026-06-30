# FIX REQUIRED -> READY example

Source: extracted and abridged from `EVIDENCE.md` Live run 5.

Evidence tier: publicly verifiable maintainer run. This is real Type-B evidence for a repair loop, with an explicitly disclosed runtime gap because udflow's own repo has no web UI.

URL note: `EVIDENCE.md` records historical `simba6507` URLs from the time of the run; this example uses the current canonical `kktu6507` repository URLs after transfer.

## Task

Implement four user-requested enhancements into udflow's own contract files:

- `--deep` + UI drives live browser evidence via Claude in Chrome.
- `--report full` splits cost into Input / Output / Cache-write / Cache-read.
- `ui-ux-pro-max` is required at planning for design-system scope, with fallback disclosure.
- `--report full` embeds final changed-UI screenshots.

The task also included the 0.23.0 version bump and CHANGELOG update. It was spec/docs-only: no hook or machine-token change.

## Intent Given

Contract-level intent with six acceptance criteria and three design forks resolved before editing:

- browser-evidence enforcement scope
- screenshot directory
- reference-file structure

Explicit constraints: keep udflow's spirit and token economy, and do not touch hooks.

## Reviewers Selected

Initial panel:

- `spec`
- `test`
- `architecture`
- `security`
- `ui-ux`
- `operability`
- adversarial verification
- `gatekeeper`

Repair round addition:

- `code-reviewer`, for the new validator JavaScript guard.

## Initial Verdict

`FIX REQUIRED`

## What Blocked READY

Two major security findings:

- Browser-driving evidence can read authenticated session data such as cookies, tokens, PII, page text, network activity, or console output, but the draft lacked data-sensitivity disclosure.
- Changed-state screenshots embedded in `--report full` could leak sensitive visual data even if screenshot files are gitignored.

The gatekeeper accepted these as real release blockers and withheld `READY`.

## Repair

The repair added or clarified:

- data-sensitivity disclosure
- a `.gitignore` protection pattern for evidence artifacts
- guidance not to paste sensitive screenshots into public PRs
- a no-destructive-interaction invariant
- a validator guard and paired regression test

## Verification

- `node .github/scripts/validate-structure.mjs` passed, including the new cost-table guard.
- `node --test` passed: 127 pass, 0 fail, 4 pre-existing Windows symlink skips.
- Hooks were byte-unchanged.
- GitHub CI passed on macOS, Ubuntu, and Windows.

Runtime gap disclosed: udflow's own repo has no web UI, so the actual browser-driving and screenshot-capture runtime path could not be exercised in this repo.

## Final Verdict

`READY`

## Outcome

Merged in PR #30 and auto-released as `v0.23.0`; compatibility follow-up PR #31 recorded Copilot live verification.

Evidence:

- https://github.com/kktu6507/universal-dev-flow-plugin/pull/30
- https://github.com/kktu6507/universal-dev-flow-plugin/pull/31
